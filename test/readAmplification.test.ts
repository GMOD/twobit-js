import { BlobFile, LocalFile } from 'generic-filehandle2'
import { describe, expect, it } from 'vitest'

import { TwoBitFile } from '../src/index.ts'

// Counts what a read actually pulls off disk, because over HTTP every one of
// these is a range request. The numbers here are the ones the README quotes.
class CountingFile extends LocalFile {
  reads: { position: number; length: number }[] = []

  override async read(length: number, position = 0) {
    const data = await super.read(length, position)
    this.reads.push({ position, length: data.length })
    return data
  }
}

describe('what getSequence reads', () => {
  it('takes four reads, three of them a 32 byte header', async () => {
    const filehandle = new CountingFile('test/data/volvox.2bit')
    const file = new TwoBitFile({ filehandle })
    await file.getSequenceNames()
    filehandle.reads = []

    const sequence = await file.getSequence('ctgA', 0, 1000)
    expect(sequence).toHaveLength(1000)
    expect(filehandle.reads).toHaveLength(4)

    const header = filehandle.reads.slice(0, 3)
    expect(header.reduce((sum, r) => sum + r.length, 0)).toBe(32)
  })

  it('re-reads that header for every sequence read, at the same offsets', async () => {
    const filehandle = new CountingFile('test/data/volvox.2bit')
    const file = new TwoBitFile({ filehandle })
    await file.getSequenceNames()

    filehandle.reads = []
    await file.getSequence('ctgA', 0, 1000)
    const first = filehandle.reads.slice(0, 3)

    filehandle.reads = []
    await file.getSequence('ctgA', 1000, 2000)
    expect(filehandle.reads.slice(0, 3)).toEqual(first)

    // and the bases move on, which is what the fourth read is
    expect(filehandle.reads[3]!.position).toBeGreaterThan(first[2]!.position)
  })
})

// a .2bit of `count` empty sequences named by `nameOf`: header, index, records
function manyEmptySequences(count: number, nameOf: (i: number) => string) {
  const names = Array.from({ length: count }, (_, i) => nameOf(i))
  const indexLength = names.reduce((sum, n) => sum + 1 + n.length + 4, 0)
  const buf = new Uint8Array(16 + indexLength + count * 16)
  const view = new DataView(buf.buffer)
  view.setUint32(0, 0x1a412743, true)
  view.setInt32(4, 0, true)
  view.setUint32(8, count, true)
  let p = 16
  for (const [i, name] of names.entries()) {
    buf[p++] = name.length
    for (const ch of name) {
      buf[p++] = ch.codePointAt(0)!
    }
    view.setUint32(p, 16 + indexLength + i * 16, true)
    p += 4
  }
  return { names, buf }
}

// the length ASKED for: a real file goes on past its index, so an over-sized
// request is what comes down the wire even when this fixture ends early
class CountingBlob extends BlobFile {
  reads: { position: number; length: number }[] = []

  override async read(length: number, position = 0) {
    this.reads.push({ position, length })
    return super.read(length, position)
  }
}

describe('what getIndex reads', () => {
  // sized for 255-byte names, a 315k-scaffold assembly's index cost 118 MB
  it('sizes the index read by typical names, not the longest a name can be', async () => {
    const { names, buf } = manyEmptySequences(100_000, i => `NW_${String(i)}.1`)
    const filehandle = new CountingBlob(new Blob([buf]))
    const file = new TwoBitFile({ filehandle })
    expect(await file.getSequenceNames()).toEqual(names)
    const indexReads = filehandle.reads.filter(r => r.position >= 16)
    const bytes = indexReads.reduce((sum, r) => sum + r.length, 0)
    expect(indexReads.length).toBeLessThanOrEqual(2)
    expect(bytes).toBeLessThan(100_000 * 32)
  })

  it('reads on from the record a chunk cut when names run long', async () => {
    const { names, buf } = manyEmptySequences(500, i =>
      `${String(i)}_`.padEnd(200 + (i % 50), 'x'),
    )
    const filehandle = new CountingBlob(new Blob([buf]))
    const file = new TwoBitFile({ filehandle })
    expect(await file.getSequenceNames()).toEqual(names)
    expect(
      filehandle.reads.filter(r => r.position >= 16).length,
    ).toBeGreaterThan(1)
    expect(await file.getSequenceSize(names.at(-1)!)).toBe(0)
  })

  it('names a truncated index', async () => {
    const { buf } = manyEmptySequences(1000, i => `contig${String(i)}`)
    const file = new TwoBitFile({
      filehandle: new BlobFile(new Blob([buf.subarray(0, 5000)])),
    })
    await expect(file.getSequenceNames()).rejects.toThrow(/sequences unread/)
  })
})
