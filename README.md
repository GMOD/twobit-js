# @gmod/twobit

[![NPM version](https://img.shields.io/npm/v/@gmod/twobit.svg?style=flat-square)](https://npmjs.org/package/@gmod/twobit)
[![Coverage Status](https://img.shields.io/codecov/c/github/GMOD/twobit-js/master.svg?style=flat-square)](https://codecov.io/gh/GMOD/twobit-js/branch/master)
[![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/twobit-js/push.yml?branch=master)](https://github.com/GMOD/twobit-js/actions)

Read .2bit sequence files using pure JavaScript, works in node or in the browser.

## Install

    $ npm install --save @gmod/twobit

## Usage

```js
const { TwoBitFile } = require('@gmod/twobit')
const t = new TwoBitFile({
  path: require.resolve('./data/foo.2bit'),
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

### TwoBitFile

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

##### Table of Contents

*   [constructor](#constructor)
    *   [Parameters](#parameters)
*   [getSequenceNames](#getsequencenames)
*   [getSequenceSizes](#getsequencesizes)
*   [getSequenceSize](#getsequencesize)
    *   [Parameters](#parameters-1)
*   [getSequence](#getsequence)
    *   [Parameters](#parameters-2)

#### constructor

##### Parameters

*   `args` **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

    *   `args.filehandle` **Filehandle?** node fs.promises-like filehandle for the .2bit file.
        Only needs to support `filehandle.read(buffer, offset, length, position)`
    *   `args.path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** filesystem path for the .2bit file to open

#### getSequenceNames

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** for an array of string sequence names that are found in the file

#### getSequenceSizes

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** for an object listing the lengths of all sequences like
`{seqName: length, ...}`.note: this is a relatively slow operation especially if there are many
refseqs in the file, if you can get this information from a different file
e.g. a chrom.sizes file, it will be much faster

#### getSequenceSize

##### Parameters

*   `seqName` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** name of the sequence

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** for the sequence's length, or undefined if it is not in the file

#### getSequence

##### Parameters

*   `seqName` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** name of the sequence you want
*   `regionStart` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** optional 0-based half-open start of the sequence region to fetch. (optional, default `0`)
*   `regionEnd` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** optional 0-based half-open end of the sequence region to fetch. defaults to end of the sequence (optional, default `Number.POSITIVE_INFINITY`)

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** for a string of sequence bases

## Academic Use

This package was written with funding from the [NHGRI](http://genome.gov) as part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic project that you publish, please cite the most recent JBrowse paper, which will be linked from [jbrowse.org](http://jbrowse.org).

## License

MIT © [Robert Buels](https://github.com/rbuels)
