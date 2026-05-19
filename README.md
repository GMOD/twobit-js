# @gmod/twobit

[![NPM version](https://img.shields.io/npm/v/@gmod/twobit.svg?style=flat-square)](https://npmjs.org/package/@gmod/twobit)
[![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/twobit-js/publish.yml?branch=main)](https://github.com/GMOD/twobit-js/actions)

Read .2bit sequence files, works in Node.js or the browser.

## Install

    $ npm install @gmod/twobit

## Usage

### Node.js — local file

```js
import { TwoBitFile } from '@gmod/twobit'

const t = new TwoBitFile({ path: 'path/to/file.2bit' })

// coordinates are 0-based half-open
const region = await t.getSequence('chr1', 0, 10)
const fullSeq = await t.getSequence('chr1')
const sizes = await t.getSequenceSizes() // { seqName: length, ... }
const size = await t.getSequenceSize('chr1')
const names = await t.getSequenceNames()
```

### Browser / remote file

Pass a `filehandle` from [`generic-filehandle2`](https://www.npmjs.com/package/generic-filehandle2):

```js
import { TwoBitFile } from '@gmod/twobit'
import { RemoteFile } from 'generic-filehandle2'

const t = new TwoBitFile({
  filehandle: new RemoteFile('https://example.com/file.2bit'),
})
const region = await t.getSequence('chr1', 0, 10)
```

## API

### `new TwoBitFile({ path?, filehandle? })`

- `path` — filesystem path to the .2bit file (Node.js only)
- `filehandle` — any object implementing `read(length, position): Promise<Uint8Array>`. Typically an instance from `generic-filehandle2` (`LocalFile`, `RemoteFile`, `BlobFile`).

### `getSequenceNames()` → `Promise<string[]>`

Returns all sequence names in the file.

### `getSequenceSizes()` → `Promise<Record<string, number>>`

Returns all sequence lengths as `{ seqName: length, ... }`.

Note: slow if there are many sequences — prefer a chrom.sizes file if available.

### `getSequenceSize(seqName)` → `Promise<number | undefined>`

Returns the length of `seqName`, or `undefined` if not found.

### `getSequence(seqName, regionStart?, regionEnd?)` → `Promise<string | undefined>`

Returns sequence bases as a string. Coordinates are 0-based half-open. `regionStart` defaults to `0`, `regionEnd` defaults to end of sequence.

The returned string preserves the 2bit format's case/ambiguity encoding:

- **Uppercase `A`/`C`/`G`/`T`** — unmasked bases
- **Lowercase `a`/`c`/`g`/`t`** — soft-masked bases (e.g. repeats)
- **`N`** — ambiguous base
- **`n`** — soft-masked ambiguous base

Edge cases:

- Returns `undefined` if `seqName` is not found in the file
- Returns `''` if `regionStart` is past the end of the sequence
- `regionEnd` past the end is clamped to the sequence length
- Throws `TypeError` if `regionStart < 0`

## Publishing

[Trusted publishing](https://docs.npmjs.com/about-trusted-publishing) via GitHub Actions.

```bash
pnpm version patch  # or minor/major
```

## Academic Use

This package was written with funding from the [NHGRI](http://genome.gov) as part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic project that you publish, please cite the most recent JBrowse paper, which will be linked from [jbrowse.org](http://jbrowse.org).

## License

MIT © [Robert Buels](https://github.com/rbuels)
