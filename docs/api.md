# API

All coordinates are 0-based half-open.

## `new TwoBitFile({ path?, filehandle? })`

- `path` — filesystem path to the .2bit file (Node.js only)
- `filehandle` — any object implementing `read(length, position): Promise<Uint8Array>`, typically a `LocalFile`, `RemoteFile`, or `BlobFile` from
  [`generic-filehandle2`](https://www.npmjs.com/package/generic-filehandle2)

Throws if neither is given. Both version 0 and version 1 ("long", 64-bit
offsets) files are supported; the header and sequence index are read once and
shared by all later calls.

## `getSequenceNames()` → `Promise<string[]>`

All sequence names in the file, in index order.

## `getSequenceSizes()` → `Promise<Record<string, number>>`

All sequence lengths as `{ seqName: length, ... }`.

This issues one read per sequence, in parallel, so it is slow when a file has
many sequences — especially over a remote filehandle, where each read is a
request. Prefer a chrom.sizes file if you have one.

## `getSequenceSize(seqName)` → `Promise<number | undefined>`

Length of `seqName`, or `undefined` if it is not in the file.

## `getSequence(seqName, regionStart?, regionEnd?)` → `Promise<string | undefined>`

Sequence bases as a string. `regionStart` defaults to `0`, `regionEnd` to the
end of the sequence.

The returned string preserves the 2bit format's case and ambiguity encoding:

| Character       | Meaning                       |
| --------------- | ----------------------------- |
| `A` `C` `G` `T` | unmasked base                 |
| `a` `c` `g` `t` | soft-masked base, e.g. repeat |
| `N`             | ambiguous base                |
| `n`             | soft-masked ambiguous base    |

Edge cases:

- returns `undefined` if `seqName` is not in the file
- returns `''` if `regionStart` is at or past the end of the sequence
- `regionEnd` past the end is clamped to the sequence length
- throws `TypeError` if `regionStart < 0`
