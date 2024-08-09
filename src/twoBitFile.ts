import { LocalFile, GenericFilehandle } from 'generic-filehandle'

const TWOBIT_MAGIC = 0x1a412743

function tinyMemoize(_class: any, methodName: string) {
  const method = _class.prototype[methodName]
  const memoAttributeName = `_memo_${methodName}`
  _class.prototype[methodName] = function _tinyMemoized() {
    if (!(memoAttributeName in this)) {
      this[memoAttributeName] = method.call(this)
    }
    return this[memoAttributeName]
  }
}

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
    const returnValue = await this.filehandle.read(
      Buffer.allocUnsafe(8),
      0,
      8,
      0,
    )
    const { buffer } = returnValue
    if (buffer.readInt32LE(0) === TWOBIT_MAGIC) {
      this.version = buffer.readInt32LE(4)
    } else if (buffer.readInt32BE(0) === TWOBIT_MAGIC) {
      throw new Error('big endian not supported')
    } else {
      throw new Error('not a 2bit file')
    }
  }

  // memoize
  /**
   * @returns {Promise} for object with the file's header information, like
   *  `{ magic: 0x1a412743, version: 0, sequenceCount: 42, reserved: 0 }`
   */
  async getHeader() {
    await this._detectEndianness()

    const { buffer } = await this.filehandle.read(
      Buffer.allocUnsafe(16),
      0,
      16,
      0,
    )

    const b = buffer
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

    return { version, magic, sequenceCount, reserved }
  }

  // memoize
  /**
   * @returns {Promise} for object with the file's index of offsets, like `{ seqName: fileOffset, ...}`
   */
  async getIndex() {
    const header = await this.getHeader()
    const maxIndexLength =
      8 + header.sequenceCount * (1 + 256 + (this.version === 1 ? 8 : 4))
    const { buffer } = await this.filehandle.read(
      Buffer.allocUnsafe(maxIndexLength),
      0,
      maxIndexLength,
      8,
    )

    const le = true
    const b = buffer
    const dataView = new DataView(b.buffer, b.byteOffset, b.length)
    let offset = 0
    const sequenceCount = dataView.getUint32(offset, le)
    offset += 4
    // const reserved = dataView.getUint32(offset, le)
    offset += 4
    const indexData = []
    for (let i = 0; i < sequenceCount; i++) {
      const nameLength = dataView.getUint8(offset)
      offset += 1
      const name = buffer.subarray(offset, offset + nameLength).toString()
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
      indexData.map(({ name, offset }) => [name, offset]),
    )
  }

  /**
   * @returns {Promise} for an array of string sequence names that are found in the file
   */
  async getSequenceNames() {
    const index = await this.getIndex()
    return Object.keys(index)
  }

  /**
   * @returns {Promise} for an object listing the lengths of all sequences like
   * `{seqName: length, ...}`.
   *
   * note: this is a relatively slow operation especially if there are many
   * refseqs in the file, if you can get this information from a different file
   * e.g. a chrom.sizes file, it will be much faster
   */
  async getSequenceSizes() {
    const index = await this.getIndex()
    const seqNames = Object.keys(index)
    const sizePromises = Object.values(index).map(offset =>
      this._getSequenceSize(offset),
    )
    const sizes = await Promise.all(sizePromises)
    const returnObject = {} as Record<string, number>
    for (const [index_, seqName] of seqNames.entries()) {
      returnObject[seqName] = sizes[index_]
    }
    return returnObject
  }

  /**
   * @param {string} seqName name of the sequence
   * @returns {Promise} for the sequence's length, or undefined if it is not in the file
   */
  async getSequenceSize(seqName: string) {
    const index = await this.getIndex()
    const offset = index[seqName]
    if (!offset) {
      return undefined
    }
    return this._getSequenceSize(offset)
  }

  async _getSequenceSize(offset: number) {
    return this._record1(offset).then(f => f.dnaSize)
  }

  async _record1(offset2: number, len = 8) {
    const { buffer } = await this.filehandle.read(
      Buffer.allocUnsafe(len),
      0,
      len,
      offset2,
    )
    const b = buffer
    const le = true
    let offset = 0
    const dataView = new DataView(b.buffer, b.byteOffset, b.length)

    const dnaSize = dataView.getUint32(offset, le)
    offset += 4
    const nBlockCount = dataView.getUint32(offset, le)
    offset += 4
    return { dnaSize, nBlockCount }
  }

  async _record2(offset2: number, len: number) {
    const { buffer } = await this.filehandle.read(
      Buffer.allocUnsafe(len),
      0,
      len,
      offset2,
    )
    const b = buffer
    const le = true
    let offset = 0
    const dataView = new DataView(b.buffer, b.byteOffset, b.length)

    const nBlockCount = dataView.getUint32(offset, le)
    offset += 4
    const nBlockStarts = [] as number[]
    for (let i = 0; i < nBlockCount; i++) {
      const elt = dataView.getUint32(offset, le)
      offset += 4
      nBlockStarts.push(elt)
    }
    const nBlockSizes = [] as number[]
    for (let i = 0; i < nBlockCount; i++) {
      const elt = dataView.getUint32(offset, le)
      offset += 4
      nBlockSizes.push(elt)
    }
    const maskBlockCount = dataView.getUint32(offset, le)
    return {
      maskBlockCount,
      nBlockSizes,
      nBlockStarts,
    }
  }
  async _record3(offset2: number, len: number) {
    const { buffer } = await this.filehandle.read(
      Buffer.allocUnsafe(len),
      0,
      len,
      offset2,
    )
    const b = buffer
    const le = true
    let offset = 0
    const dataView = new DataView(b.buffer, b.byteOffset, b.length)

    const maskBlockCount = dataView.getUint32(offset, le)
    offset += 4
    const maskBlockStarts = [] as number[]
    for (let i = 0; i < maskBlockCount; i++) {
      const elt = dataView.getUint32(offset, le)
      offset += 4
      maskBlockStarts.push(elt)
    }
    const maskBlockSizes = [] as number[]
    for (let i = 0; i < maskBlockCount; i++) {
      const elt = dataView.getUint32(offset, le)
      offset += 4
      maskBlockSizes.push(elt)
    }
    const reserved = dataView.getInt32(offset, le)
    return {
      maskBlockCount,
      maskBlockSizes,
      maskBlockStarts,
      reserved,
    }
  }

  async _getSequenceRecord(offset: number) {
    const rec1 = await this._record1(offset)
    const rec2DataLen = rec1.nBlockCount * 8 + 8
    const rec2 = await this._record2(offset + 4, rec2DataLen)
    const rec3DataLen = rec2.maskBlockCount * 8 + 8
    const rec3 = await this._record3(offset + 4 + rec2DataLen - 4, rec3DataLen)

    const rec = {
      dnaSize: rec1.dnaSize,
      nBlocks: {
        starts: rec2.nBlockStarts,
        sizes: rec2.nBlockSizes,
      },
      maskBlocks: {
        starts: rec3.maskBlockStarts,
        sizes: rec3.maskBlockSizes,
      },
      dnaPosition: offset + 4 + rec2DataLen - 4 + rec3DataLen,
    }
    return rec
  }

  /**
   * @param {string} seqName name of the sequence you want
   * @param {number} [regionStart] optional 0-based half-open start of the sequence region to fetch.
   * @param {number} [regionEnd] optional 0-based half-open end of the sequence region to fetch. defaults to end of the sequence
   * @returns {Promise} for a string of sequence bases
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
    if (regionEnd === undefined || regionEnd > record.dnaSize) {
      regionEnd = record.dnaSize
    }

    const nBlocks = this._getOverlappingBlocks(
      regionStart,
      regionEnd,
      record.nBlocks.starts,
      record.nBlocks.sizes,
    )
    const maskBlocks = this._getOverlappingBlocks(
      regionStart,
      regionEnd,
      record.maskBlocks.starts,
      record.maskBlocks.sizes,
    )

    const baseBytes = Buffer.allocUnsafe(
      Math.ceil((regionEnd - regionStart) / 4) + 1,
    )
    const baseBytesOffset = Math.floor(regionStart / 4)
    const { buffer } = await this.filehandle.read(
      baseBytes,
      0,
      baseBytes.length,
      record.dnaPosition + baseBytesOffset,
    )

    let sequenceBases = ''
    for (
      let genomicPosition = regionStart;
      genomicPosition < regionEnd;
      genomicPosition += 1
    ) {
      // check whether we are currently masked
      while (maskBlocks.length > 0 && maskBlocks[0].end <= genomicPosition) {
        maskBlocks.shift()
      }
      const baseIsMasked =
        maskBlocks[0] &&
        maskBlocks[0].start <= genomicPosition &&
        maskBlocks[0].end > genomicPosition

      // process the N block if we have one
      if (
        nBlocks[0] &&
        genomicPosition >= nBlocks[0].start &&
        genomicPosition < nBlocks[0].end
      ) {
        const currentNBlock = nBlocks.shift()
        for (
          ;
          genomicPosition < currentNBlock.end && genomicPosition < regionEnd;
          genomicPosition += 1
        ) {
          sequenceBases += baseIsMasked ? 'n' : 'N'
        }
        genomicPosition -= 1
      } else {
        const bytePosition = Math.floor(genomicPosition / 4) - baseBytesOffset
        const subPosition = genomicPosition % 4
        const byte = buffer[bytePosition]
        sequenceBases += baseIsMasked
          ? maskedByteTo4Bases[byte][subPosition]
          : byteTo4Bases[byte][subPosition]
      }
    }

    return sequenceBases
  }

  _getOverlappingBlocks(
    regionStart: number,
    regionEnd: number,
    blockStarts: number[],
    blockSizes: number[],
  ) {
    // find the start and end indexes of the blocks that match
    let startIndex: number | undefined
    let endIndex: number | undefined
    for (const [index, blockStart] of blockStarts.entries()) {
      const blockSize = blockSizes[index]
      if (regionStart >= blockStart + blockSize || regionEnd <= blockStart) {
        // block does not overlap the region
        if (startIndex !== undefined) {
          endIndex = index
          break
        }
      } else if (startIndex === undefined) {
        startIndex = index
      } // block does overlap the region, record this if it is the first
    }

    if (startIndex === undefined) {
      return []
    }

    // now format some block objects to return
    if (endIndex === undefined) {
      endIndex = blockStarts.length
    }

    const blocks = new Array(endIndex - startIndex)
    for (
      let blockNumber = startIndex;
      blockNumber < endIndex;
      blockNumber += 1
    ) {
      blocks[blockNumber - startIndex] = {
        start: blockStarts[blockNumber],
        end: blockStarts[blockNumber] + blockSizes[blockNumber],
        size: blockSizes[blockNumber],
      }
    }
    return blocks
  }
}

tinyMemoize(TwoBitFile, 'getIndex')
tinyMemoize(TwoBitFile, 'getHeader')
