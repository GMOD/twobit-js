import { LocalFile } from 'generic-filehandle2'

import type { GenericFilehandle } from 'generic-filehandle2'

const twoBit = ['T', 'C', 'A', 'G']
// byteTo4Bases is an array of byteValue -> 'ACTG'
const byteTo4Bases: string[] = []
for (let index = 0; index < 256; index++) {
  byteTo4Bases.push(
    twoBit[(index >> 6) & 3]! +
      twoBit[(index >> 4) & 3]! +
      twoBit[(index >> 2) & 3]! +
      twoBit[index & 3]!,
  )
}

const maskedByteTo4Bases = byteTo4Bases.map(bases => bases.toLowerCase())

function dataViewOf(b: Uint8Array): DataView {
  return new DataView(b.buffer, b.byteOffset, b.length)
}

function readBlockPair(view: DataView, count: number) {
  const aligned = new Uint32Array(count * 2)
  for (let i = 0; i < count * 2; i++) {
    aligned[i] = view.getUint32(i * 4, true)
  }
  return {
    starts: aligned.subarray(0, count),
    sizes: aligned.subarray(count),
  }
}

interface Blocks {
  starts: ArrayLike<number>
  sizes: ArrayLike<number>
}

// binary search for first block whose end > regionStart
function getOverlappingBlockStartIdx(
  regionStart: number,
  { starts, sizes }: Blocks,
) {
  let lo = 0
  let hi = starts.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    const blockEnd = starts[mid]! + sizes[mid]!
    if (blockEnd <= regionStart) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  return lo
}

/**
 * walks a sorted list of non-overlapping blocks alongside a scan of the
 * sequence. calling the returned function with a monotonically increasing
 * position says whether that position is inside a block, and where the next
 * change of that state happens (block end when inside, next block start when
 * outside, Infinity when no blocks are left)
 */
function makeBlockScanner(blocks: Blocks, regionStart: number) {
  const { starts, sizes } = blocks
  let idx = getOverlappingBlockStartIdx(regionStart, blocks)
  return (position: number) => {
    while (idx < starts.length && starts[idx]! + sizes[idx]! <= position) {
      idx++
    }
    const start = idx < starts.length ? starts[idx]! : Infinity
    return start <= position
      ? { inside: true, boundary: start + sizes[idx]! }
      : { inside: false, boundary: start }
  }
}

export default class TwoBitFile {
  private filehandle: GenericFilehandle
  private headerP: ReturnType<typeof this.getHeaderData> | undefined
  private indexP: ReturnType<typeof this.getIndexData> | undefined

  /**
   * @param {object} args
   * @param {string} [args.path] filesystem path for the .2bit file to open
   * @param {Filehandle} [args.filehandle] filehandle for the .2bit file. Only
   *  needs to support `filehandle.read(length, position)`
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

  private async readView(length: number, position: number) {
    return dataViewOf(await this.filehandle.read(length, position))
  }

  getHeader() {
    this.headerP ??= this.getHeaderData().catch((error: unknown) => {
      this.headerP = undefined
      throw error
    })
    return this.headerP
  }

  private async getHeaderData() {
    const dataView = await this.readView(16, 0)
    const magic = dataView.getInt32(0, true)
    if (magic !== 0x1a412743) {
      throw new Error(`Wrong magic number ${String(magic)}`)
    }
    return {
      magic,
      version: dataView.getInt32(4, true),
      sequenceCount: dataView.getUint32(8, true),
      reserved: dataView.getUint32(12, true),
    }
  }

  getIndex() {
    this.indexP ??= this.getIndexData().catch((error: unknown) => {
      this.indexP = undefined
      throw error
    })
    return this.indexP
  }

  private async getIndexData() {
    const { sequenceCount, version } = await this.getHeader()
    // version 1 ("long") files use 64-bit sequence offsets, and a name is at
    // most 255 bytes because its length is stored in a single byte
    const offsetSize = version === 1 ? 8 : 4
    const maxIndexLength = sequenceCount * (1 + 255 + offsetSize)
    const b = await this.filehandle.read(maxIndexLength, 16)

    const dataView = dataViewOf(b)
    const decoder = new TextDecoder('ascii')
    let offset = 0
    const entries: [name: string, offset: number][] = []
    for (let i = 0; i < sequenceCount; i++) {
      const nameLength = dataView.getUint8(offset)
      offset += 1
      const name = decoder.decode(b.subarray(offset, offset + nameLength))
      offset += nameLength
      entries.push([
        name,
        offsetSize === 8
          ? Number(dataView.getBigUint64(offset, true))
          : dataView.getUint32(offset, true),
      ])
      offset += offsetSize
    }

    return Object.fromEntries(entries)
  }

  /**
   * @returns array of sequence names in the file
   */
  async getSequenceNames() {
    const index = await this.getIndex()
    return Object.keys(index)
  }

  /**
   * @returns object listing the lengths of all sequences like `{seqName: length, ...}`.
   *
   * note: this is a relatively slow operation especially if there are many
   * refseqs in the file, if you can get this information from a different file
   * e.g. a chrom.sizes file, it will be much faster
   */
  async getSequenceSizes() {
    const index = await this.getIndex()
    const entries = await Promise.all(
      Object.entries(index).map(
        async ([name, offset]) =>
          [name, await this.getSequenceSizeAt(offset)] as const,
      ),
    )
    return Object.fromEntries(entries)
  }

  /**
   * @param seqName name of the sequence
   *
   * @returns sequence length, or undefined if it is not in the file
   */
  async getSequenceSize(seqName: string) {
    const index = await this.getIndex()
    const offset = index[seqName]
    return offset === undefined ? undefined : this.getSequenceSizeAt(offset)
  }

  private async getSequenceSizeAt(offset: number) {
    const view = await this.readView(4, offset)
    return view.getUint32(0, true)
  }

  private async getSequenceRecord(offset: number) {
    const header = await this.readView(8, offset)
    const dnaSize = header.getUint32(0, true)
    const nBlockCount = header.getUint32(4, true)

    // nBlocks data + trailing maskBlockCount u32
    const nLen = nBlockCount * 8 + 4
    const nView = await this.readView(nLen, offset + 8)
    const nBlocks = readBlockPair(nView, nBlockCount)
    const maskBlockCount = nView.getUint32(nBlockCount * 8, true)

    // maskBlocks data + trailing reserved u32
    const mLen = maskBlockCount * 8 + 4
    const mView = await this.readView(mLen, offset + 8 + nLen)
    const maskBlocks = readBlockPair(mView, maskBlockCount)

    return {
      dnaSize,
      nBlocks,
      maskBlocks,
      dnaPosition: offset + 8 + nLen + mLen,
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
   * @returns string of sequence bases, or undefined if the sequence is not in
   * the file
   */
  async getSequence(
    seqName: string,
    regionStart = 0,
    regionEnd = Number.POSITIVE_INFINITY,
  ) {
    if (regionStart < 0) {
      throw new TypeError('regionStart cannot be less than 0')
    }
    const index = await this.getIndex()
    const offset = index[seqName]
    if (offset === undefined) {
      return undefined
    }
    // fetch the record for the seq
    const record = await this.getSequenceRecord(offset)

    // end defaults to the end of the sequence
    const end = Math.min(regionEnd, record.dnaSize)
    // if start is past end (e.g. regionStart > dnaSize), nothing to fetch
    if (regionStart >= end) {
      return ''
    }

    const baseBytesLen = Math.ceil((end - regionStart) / 4) + 1
    const baseBytesOffset = Math.floor(regionStart / 4)
    const buffer = await this.filehandle.read(
      baseBytesLen,
      record.dnaPosition + baseBytesOffset,
    )

    const scanN = makeBlockScanner(record.nBlocks, regionStart)
    const scanMask = makeBlockScanner(record.maskBlocks, regionStart)

    const sequenceParts: string[] = []
    let genomicPosition = regionStart

    while (genomicPosition < end) {
      const n = scanN(genomicPosition)
      const mask = scanMask(genomicPosition)
      // the run of bases we can emit in one style, stopping wherever the N
      // state or the mask state next changes
      const runEnd = Math.min(end, n.boundary, mask.boundary)

      if (n.inside) {
        sequenceParts.push(
          (mask.inside ? 'n' : 'N').repeat(runEnd - genomicPosition),
        )
        genomicPosition = runEnd
      } else {
        const lookup = mask.inside ? maskedByteTo4Bases : byteTo4Bases

        // process bases up to runEnd using bitwise ops for speed
        while (genomicPosition < runEnd) {
          const bytePosition = (genomicPosition >>> 2) - baseBytesOffset
          const subPosition = genomicPosition & 3
          const byte = buffer[bytePosition]!

          // if aligned to byte boundary and have room for full byte, emit all 4
          if (subPosition === 0 && genomicPosition + 4 <= runEnd) {
            sequenceParts.push(lookup[byte]!)
            genomicPosition += 4
          } else {
            sequenceParts.push(lookup[byte]![subPosition]!)
            genomicPosition += 1
          }
        }
      }
    }

    return sequenceParts.join('')
  }
}
