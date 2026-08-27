import { LocalFile } from 'generic-filehandle2'
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
