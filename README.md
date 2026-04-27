# @gmod/twobit

[![NPM version](https://img.shields.io/npm/v/@gmod/twobit.svg?style=flat-square)](https://npmjs.org/package/@gmod/twobit)
[![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/twobit-js/push.yml?branch=main)](https://github.com/GMOD/twobit-js/actions)

Read .2bit sequence files, works in Node.js or the browser.

## Install

    $ npm install @gmod/twobit

## Usage

```js
import { TwoBitFile } from '@gmod/twobit'

const t = new TwoBitFile({
  path: 'path/to/file.2bit',
})

// get the first 10 bases of a sequence from the file.
// coordinates are UCSC standard 0-based half-open
const chr1Region = await t.getSequence('chr1', 0, 10)
// chr1Region is now a string of bases, 'ACTG...'

// get a whole sequence from the file
const chr1Bases = await t.getSequence('chr1')

// get object with all seq lengths as { seqName => length, ... }
const allSequenceSizes = await t.getSequenceSizes()

// get the size of a single sequence
const chr1Size = await t.getSequenceSize('chr1')

// get an array of all sequence names in the file
const seqNames = await t.getSequenceNames()
```

## API

### `new TwoBitFile({ path?, filehandle? })`

- `path` — filesystem path to the .2bit file
- `filehandle` — fs.promises-like filehandle; only needs to support `read(buffer, offset, length, position)`

### `getSequenceNames()` → `Promise<string[]>`

Returns all sequence names in the file.

### `getSequenceSizes()` → `Promise<Record<string, number>>`

Returns all sequence lengths as `{ seqName: length, ... }`.

Note: slow if there are many sequences — prefer a chrom.sizes file if available.

### `getSequenceSize(seqName)` → `Promise<number | undefined>`

Returns the length of `seqName`, or `undefined` if not found.

### `getSequence(seqName, regionStart?, regionEnd?)` → `Promise<string | undefined>`

Returns sequence bases as a string, or `undefined` if `seqName` is not found. Coordinates are 0-based half-open. `regionStart` defaults to `0`, `regionEnd` defaults to end of sequence.

## Publishing

Releases are published to npm using [npm provenance and trusted publishing](https://docs.npmjs.com/generating-provenance-statements) via GitHub Actions.

## Academic Use

This package was written with funding from the [NHGRI](http://genome.gov) as part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic project that you publish, please cite the most recent JBrowse paper, which will be linked from [jbrowse.org](http://jbrowse.org).

## License

MIT © [Robert Buels](https://github.com/rbuels)
