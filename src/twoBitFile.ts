import { LocalFile } from 'generic-filehandle2'

import type { GenericFilehandle } from 'generic-filehandle2'

const TWOBIT_MAGIC = 0x1a412743

const twoBit = ['T', 'C', 'A', 'G']
// byteTo4Bases is an array of byteValue -> 'ACTG'
const byteTo4Bases = [] as string[]
for (let index = 0; index < 256; index++) {
  byteTo4Bases.push(
    twoBit[(index >> 6) & 3] +
      twoBit[(index >> 4) & 3] +
      twoBit[(index >> 2) & 3] +
      twoBit[index & 3],
  )
}

const maskedByteTo4Bases = byteTo4Bases.map(bases => bases.toLowerCase())

export default class TwoBitFile {
  private filehandle: GenericFilehandle
  private version?: number
  private headerP: ReturnType<typeof this._getHeader> | undefined
  private indexP: ReturnType<typeof this._getIndex> | undefined

  /**
   * @param {object} args
   * @param {string} [args.path] filesystem path for the .2bit file to open
   * @param {Filehandle} [args.filehandle] node fs.promises-like filehandle for the .2bit file.
   *  Only needs to support `filehandle.read(buffer, offset, length, position)`
   */
  constructor({
    filehandle,
    path,
  }: {
    filehandle?: GenericFilehandle
    path?: string
  }) {
    if (filehandle) {
      this.filehandle = filehandle
    } else if (path) {
      this.filehandle = new LocalFile(path)
    } else {
      throw new Error('must supply path or filehandle')
    }
  }

  async _detectEndianness() {
    const buffer = await this.filehandle.read(8, 0)
    const dataView = new DataView(buffer.buffer)
    const magic = dataView.getInt32(0, true)
    if (magic === TWOBIT_MAGIC) {
      this.version = dataView.getInt32(0, true)
    } else {
      throw new Error('not a 2bit file')
    }
  }

  getHeader() {
    this.headerP ??= this._getHeader().catch((error: unknown) => {
      this.headerP = undefined
      throw error
    })
    return this.headerP
  }

  async _getHeader() {
    await this._detectEndianness()

    const b = await this.filehandle.read(16, 0)
    const le = true
    const dataView = new DataView(b.buffer, b.byteOffset, b.length)
    let offset = 0
    const magic = dataView.getInt32(offset, le)
    offset += 4
    if (magic !== 0x1a412743) {
      throw new Error(`Wrong magic number ${magic}`)
    }
    const version = dataView.getInt32(offset, le)
    offset += 4
    const sequenceCount = dataView.getUint32(offset, le)
    offset += 4
    const reserved = dataView.getUint32(offset, le)

    return {
      version,
      magic,
      sequenceCount,
      reserved,
    }
  }

  getIndex() {
    this.indexP ??= this._getIndex().catch((error: unknown) => {
      this.indexP = undefined
      throw error
    })
    return this.indexP
  }

  async _getIndex() {
    const header = await this.getHeader()
    const maxIndexLength =
      8 + header.sequenceCount * (1 + 256 + (this.version === 1 ? 8 : 4))
    const b = await this.filehandle.read(maxIndexLength, 8)

    const le = true
    const dataView = new DataView(b.buffer, b.byteOffset, b.length)
    let offset = 0
    const sequenceCount = dataView.getUint32(offset, le)
    offset += 4
    // const reserved = dataView.getUint32(offset, le)
    offset += 4
    const indexData = []
    const decoder = new TextDecoder('utf8')
    for (let i = 0; i < sequenceCount; i++) {
      const nameLength = dataView.getUint8(offset)
      offset += 1
      const name = decoder.decode(b.subarray(offset, offset + nameLength))
      offset += nameLength
      if (header.version === 1) {
        const dataOffset = Number(dataView.getBigUint64(offset, le))
        offset += 8
        indexData.push({ offset: dataOffset, name })
      } else {
        const dataOffset = dataView.getUint32(offset, le)
        offset += 4
        indexData.push({ offset: dataOffset, name })
      }
    }

    return Object.fromEntries(
      indexData.map(({ name, offset }) => [name, offset] as const),
    )
  }

  /**
   * @returns for an array of string sequence names that are found in the file
   */
  async getSequenceNames() {
    const index = await this.getIndex()
    return Object.keys(index)
  }

  /**
   * @returns object listing the lengths of all sequences like `{seqName:
   * length, ...}`.
   *
   * note: this is a relatively slow operation especially if there are many
   * refseqs in the file, if you can get this information from a different file
   * e.g. a chrom.sizes file, it will be much faster
   */
  async getSequenceSizes() {
    const index = await this.getIndex()
    const seqNames = Object.keys(index)
    const sizes = await Promise.all(
      Object.values(index).map(offset => this._getSequenceSize(offset)),
    )
    const returnObject = {} as Record<string, number>
    for (const [index_, seqName] of seqNames.entries()) {
      returnObject[seqName] = sizes[index_]
    }
    return returnObject
  }

  /**
   * @param seqName name of the sequence
   *
   * @returns sequence length, or undefined if it is not in the file
   */
  async getSequenceSize(seqName: string) {
    const index = await this.getIndex()
    const offset = index[seqName]
    return offset ? this._getSequenceSize(offset) : undefined
  }

  async _getSequenceSize(offset: number) {
    const b = await this.filehandle.read(4, offset)
    const dataView = new DataView(b.buffer, b.byteOffset, b.length)
    return dataView.getUint32(0, true)
  }

  async _getSequenceRecord(offset: number) {
    // First read: get dnaSize and nBlockCount, then read nBlocks + maskBlockCount
    const header = await this.filehandle.read(8, offset)
    const headerView = new DataView(
      header.buffer,
      header.byteOffset,
      header.length,
    )
    const dnaSize = headerView.getUint32(0, true)
    const nBlockCount = headerView.getUint32(4, true)

    // Second read: nBlocks data + maskBlockCount + maskBlocks data + reserved
    // We read nBlocks, then maskBlockCount tells us how much more to read
    const nBlocksLen = nBlockCount * 8 + 4 // +4 for maskBlockCount
    const nBlocksData = await this.filehandle.read(nBlocksLen, offset + 8)
    const nBlocksView = new DataView(
      nBlocksData.buffer,
      nBlocksData.byteOffset,
      nBlocksData.length,
    )

    const nBlockStarts = new Array<number>(nBlockCount)
    const nBlockSizes = new Array<number>(nBlockCount)
    let pos = 0
    for (let i = 0; i < nBlockCount; i++, pos += 4) {
      nBlockStarts[i] = nBlocksView.getUint32(pos, true)
    }
    for (let i = 0; i < nBlockCount; i++, pos += 4) {
      nBlockSizes[i] = nBlocksView.getUint32(pos, true)
    }
    const maskBlockCount = nBlocksView.getUint32(pos, true)

    // Third read: maskBlocks data + reserved
    const maskBlocksLen = maskBlockCount * 8 + 4
    const maskBlocksData = await this.filehandle.read(
      maskBlocksLen,
      offset + 8 + nBlocksLen,
    )
    const maskBlocksView = new DataView(
      maskBlocksData.buffer,
      maskBlocksData.byteOffset,
      maskBlocksData.length,
    )

    const maskBlockStarts = new Array<number>(maskBlockCount)
    const maskBlockSizes = new Array<number>(maskBlockCount)
    pos = 0
    for (let i = 0; i < maskBlockCount; i++, pos += 4) {
      maskBlockStarts[i] = maskBlocksView.getUint32(pos, true)
    }
    for (let i = 0; i < maskBlockCount; i++, pos += 4) {
      maskBlockSizes[i] = maskBlocksView.getUint32(pos, true)
    }

    return {
      dnaSize,
      nBlocks: { starts: nBlockStarts, sizes: nBlockSizes },
      maskBlocks: { starts: maskBlockStarts, sizes: maskBlockSizes },
      dnaPosition: offset + 8 + nBlocksLen + maskBlocksLen,
    }
  }

  /**
   * @param seqName name of the sequence you want
   *
   * @param [regionStart] optional 0-based half-open start of the sequence
   * region to fetch.
   *
   * @param [regionEnd] optional 0-based half-open end of the sequence region
   * to fetch. defaults to end of the sequence
   *
   * @returns for a string of sequence bases
   */
  async getSequence(
    seqName: string,
    regionStart = 0,
    regionEnd = Number.POSITIVE_INFINITY,
  ) {
    const index = await this.getIndex()
    const offset = index[seqName]
    if (!offset) {
      return undefined
    }
    // fetch the record for the seq
    const record = await this._getSequenceRecord(offset)

    if (regionStart < 0) {
      throw new TypeError('regionStart cannot be less than 0')
    }
    // end defaults to the end of the sequence
    if (regionEnd > record.dnaSize) {
      regionEnd = record.dnaSize
    }

    const nBlockStartIdx = this._getOverlappingBlockStartIdx(
      regionStart,
      record.nBlocks.starts,
      record.nBlocks.sizes,
    )
    const maskBlockStartIdx = this._getOverlappingBlockStartIdx(
      regionStart,
      record.maskBlocks.starts,
      record.maskBlocks.sizes,
    )

    const baseBytesLen = Math.ceil((regionEnd - regionStart) / 4) + 1
    const baseBytesOffset = Math.floor(regionStart / 4)
    const buffer = await this.filehandle.read(
      baseBytesLen,
      record.dnaPosition + baseBytesOffset,
    )

    const nBlockStarts = record.nBlocks.starts
    const nBlockSizes = record.nBlocks.sizes
    const maskBlockStarts = record.maskBlocks.starts
    const maskBlockSizes = record.maskBlocks.sizes

    const sequenceParts: string[] = []
    let nBlockIdx = nBlockStartIdx
    let maskBlockIdx = maskBlockStartIdx
    for (
      let genomicPosition = regionStart;
      genomicPosition < regionEnd;
      genomicPosition += 1
    ) {
      // advance past mask blocks that end before current position
      while (
        (maskBlockStarts[maskBlockIdx] ?? Infinity) +
          (maskBlockSizes[maskBlockIdx] ?? 0) <=
        genomicPosition
      ) {
        maskBlockIdx++
      }
      const maskStart = maskBlockStarts[maskBlockIdx] ?? Infinity
      const maskEnd = maskStart + (maskBlockSizes[maskBlockIdx] ?? 0)
      const baseIsMasked =
        maskStart <= genomicPosition && maskEnd > genomicPosition

      // process the N block if we have one
      const nStart = nBlockStarts[nBlockIdx] ?? Infinity
      const nEnd = nStart + (nBlockSizes[nBlockIdx] ?? 0)
      if (genomicPosition >= nStart && genomicPosition < nEnd) {
        nBlockIdx++
        const effectiveEnd = Math.min(nEnd, regionEnd)
        const nCount = effectiveEnd - genomicPosition
        sequenceParts.push((baseIsMasked ? 'n' : 'N').repeat(nCount))
        genomicPosition = effectiveEnd - 1
      } else {
        const bytePosition = Math.floor(genomicPosition / 4) - baseBytesOffset
        const subPosition = genomicPosition % 4
        const byte = buffer[bytePosition]
        sequenceParts.push(
          baseIsMasked
            ? (maskedByteTo4Bases[byte]?.[subPosition] ?? '')
            : (byteTo4Bases[byte]?.[subPosition] ?? ''),
        )
      }
    }

    return sequenceParts.join('')
  }

  _getOverlappingBlockStartIdx(
    regionStart: number,
    blockStarts: number[],
    blockSizes: number[],
  ) {
    const len = blockStarts.length
    if (len === 0) {
      return 0
    }

    // Binary search for first block whose end > regionStart
    let lo = 0
    let hi = len
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      const blockEnd = (blockStarts[mid] ?? 0) + (blockSizes[mid] ?? 0)
      if (blockEnd <= regionStart) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }
    return lo
  }
}
