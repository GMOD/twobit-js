# @gmod/twobit

[![NPM version](https://img.shields.io/npm/v/@gmod/twobit.svg?style=flat-square)](https://npmjs.org/package/@gmod/twobit)
![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/twobit-js/publish.yml?branch=main)

Read .2bit sequence files, in Node.js or the browser.

## Install

    $ npm install @gmod/twobit

## Usage

```js
import { TwoBitFile } from '@gmod/twobit'

const t = new TwoBitFile({ path: 'path/to/file.2bit' })

// coordinates are 0-based half-open
await t.getSequence('chr1', 0, 10) // first 10 bases
await t.getSequence('chr1') // whole sequence
await t.getSequenceNames() // ['chr1', ...]
await t.getSequenceSizes() // { chr1: length, ... }
await t.getSequenceSize('chr1')
```

In the browser, or for a file over HTTP, pass a `filehandle` from
[`generic-filehandle2`](https://www.npmjs.com/package/generic-filehandle2)
instead of a `path`:

```js
import { RemoteFile } from 'generic-filehandle2'

const t = new TwoBitFile({
  filehandle: new RemoteFile('https://example.com/file.2bit'),
})
```

Returned sequences preserve the file's encoding: lowercase for soft-masked
bases, `N`/`n` for ambiguous ones.

See [docs/api.md](docs/api.md) for the full API reference.

## Academic use

This package was written with funding from the [NHGRI](http://genome.gov) as part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic project that you publish, please cite the most recent JBrowse paper, which will be linked from [jbrowse.org](http://jbrowse.org).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and release workflow.

## License

MIT © [Robert Buels](https://github.com/rbuels)
