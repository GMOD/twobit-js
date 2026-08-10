## [6.0.12](https://github.com/GMOD/twobit-js/compare/v6.0.11...v6.0.12) (2026-08-10)

### Chores

- Drop eslint-plugin-unicorn
- Type-check the tests and enforce prettier, as @gmod/bam does
- Let npm publish stop auto-correcting repository.url
- Exempt our own packages from the release quarantine
- Bump pnpm/action-setup to v6.0.10
- Run the test suite as `pnpm test --run`
- Gate preversion on format:check, as CI does
- Gate preversion on typecheck too, as CI does
- Converge package.json on the shape its siblings use

### Other Changes

- Revert "chore: converge package.json" — the CHANGELOG prettier step

Removes `prettier --write CHANGELOG.md` from the `version` script, which the
previous commit added on a premise I did not check.

The reasoning was: git-cliff writes CHANGELOG.md after `preversion` has run, so
the format:check gate structurally cannot see it, while CI checks it on the tag
commit -- a hole the gate cannot cover. The first half is true. The second is
not: **every one of the 20 repos already lists CHANGELOG.md in
.prettierignore**, so CI's format:check skips it too and there was never a hole.

The step was also a no-op, verified rather than assumed: prettier skips an
ignored file even when it is named explicitly on the command line, so a
deliberately mangled CHANGELOG.md came back unchanged.

hclust was the only repo that had this step, which is where I copied it from.
It is reverted there too. The .prettierignore comments in bgzf-filehandle,
cram-js and hclust say why nobody should add it back: reformatting a generated
changelog fights the generator on every release.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

## [6.0.11](https://github.com/GMOD/twobit-js/compare/v6.0.10...v6.0.11) (2026-08-01)

### Bug Fixes

- Build-both-branches.sh used yarn and defaulted to a master branch

### Chores

- Sha-pin actions, take pnpm version from packageManager, node 24
- Pin pnpm via the `packageManager` field, so local pnpm and CI agree
- Share one eslint-plugin-unicorn opt-out list across the repos
- Turn off unicorn/prefer-early-return across the repos
- Replace standard-changelog with git-cliff for changelog generation
- Drop unused documentation tooling and the dead es5 tsconfig

### Documentation

- Mark breaking changes in the generated changelog
- Correct release instructions and note getSequenceSizes' read count

### Refactoring

- Extract a once() memo helper, tighten types and the magic error

## [6.0.10](https://github.com/GMOD/twobit-js/compare/v6.0.9...v6.0.10) (2026-07-25)


### Bug Fixes

* remove stale workflow query link from CI badge ([099bcf4](https://github.com/GMOD/twobit-js/commit/099bcf4de21fd3b2309b6fdcdfd57c3e47b756e0))
* respect mask boundaries inside N blocks ([317e161](https://github.com/GMOD/twobit-js/commit/317e1616e9357b7a233680808498cfac5601ce77))
* update CI badge to reference publish.yml workflow ([5e74f62](https://github.com/GMOD/twobit-js/commit/5e74f62b25fa084b5ab9803a86e2f784fba7d158))

## [6.0.9](https://github.com/GMOD/twobit-js/compare/v6.0.8...v6.0.9) (2026-05-19)

## [6.0.8](https://github.com/GMOD/twobit-js/compare/v6.0.7...v6.0.8) (2026-05-19)

## [6.0.7](https://github.com/GMOD/twobit-js/compare/v6.0.6...v6.0.7) (2026-05-18)

- Docs only: add a RemoteFile/browser usage example; document getSequence's case/N encoding and edge-case behavior (undefined seqName, regionStart past end, clamped regionEnd, negative-start throw) ([25af4cb](https://github.com/GMOD/twobit-js/commit/25af4cbefff354d9c0235d76dba108aa990919a7))

## [6.0.6](https://github.com/GMOD/twobit-js/compare/v6.0.5...v6.0.6) (2026-05-18)


### Bug Fixes

* add non-null assertions for noUncheckedIndexedAccess compliance ([2c89248](https://github.com/GMOD/twobit-js/commit/2c89248e316ac137b8c742da2f3157748a56b5a3))
* handle regionStart past sequence end and clean up ([676bc7c](https://github.com/GMOD/twobit-js/commit/676bc7ccfb209aa8133f05cf0ae918977a60dd27))


### Performance Improvements

* drop the BigInt64 DataView polyfill; `getBigUint64`/`getBigInt64` are native on the es2022 target this project compiles to — a companion speculative-read optimization for `getSequenceRecord` also landed in this range but was reverted before release in favor of three precise reads, so no behavior changed there ([1f85804](https://github.com/GMOD/twobit-js/commit/1f8580428f17b9bc1b74ccd39aef3b4a71aba115), reverted by [ba9562d](https://github.com/GMOD/twobit-js/commit/ba9562d49add36eee0b5102d319bd0a695500867))

## [6.0.5](https://github.com/GMOD/twobit-js/compare/v6.0.4...v6.0.5) (2026-04-27)

## [6.0.4](https://github.com/GMOD/twobit-js/compare/v6.0.3...v6.0.4) (2026-04-27)

- Docs only: fix a broken README code example and README return types that said `any`; JSDoc cleanup ([5e22568](https://github.com/GMOD/twobit-js/commit/5e2256885ddcfb323eff50fee30e2a7682f0a0b3))

## [6.0.3](https://github.com/GMOD/twobit-js/compare/v6.0.2...v6.0.3) (2026-03-31)

## [6.0.2](https://github.com/GMOD/twobit-js/compare/v6.0.1...v6.0.2) (2026-03-28)


### Bug Fixes

* fix `this.version` being set from the magic-number offset instead of the version field (introduced in 4.0.0, present through 6.0.1), and remove the now-redundant `detectEndianness` method (`getHeaderData` already validates the magic number and reads the version). The wrong value only fed the index-buffer size estimate for v1 (64-bit-offset) `.2bit` files — the per-entry decode itself read the correctly-parsed `header.version` — and the estimate's generous per-name over-allocation meant this was not observed to cause failures in practice ([0e1fd4a](https://github.com/GMOD/twobit-js/commit/0e1fd4ab99ddef8e3f5325a7322b98d8b65bb5fc))


### Performance Improvements

* consolidate the three overlapping-read record parsers into a single `getSequenceRecord` that does three targeted reads ([d0b8c43](https://github.com/GMOD/twobit-js/commit/d0b8c4357733d91793d5dd689342ca22b0ffab93))
* replace the O(n) overlapping-block scan with a binary search ([d0b8c43](https://github.com/GMOD/twobit-js/commit/d0b8c4357733d91793d5dd689342ca22b0ffab93))
* batch N-block/mask-block reads into `Uint32Array` views instead of per-element `DataView` calls, and decode sequence bytes in aligned runs instead of one base at a time ([d0b8c43](https://github.com/GMOD/twobit-js/commit/d0b8c4357733d91793d5dd689342ca22b0ffab93))
* `getSequenceSize` now reads only the 4 bytes it needs instead of 8 ([d0b8c43](https://github.com/GMOD/twobit-js/commit/d0b8c4357733d91793d5dd689342ca22b0ffab93))

## [6.0.1](https://github.com/GMOD/twobit-js/compare/v6.0.0...v6.0.1) (2025-05-13)


### Bug Fixes

* emit `dist/package.json` with `{"type": "commonjs"}` so the CJS build isn't misparsed as ESM after the `"type": "module"` switch in 6.0.0 ([1cc6ed3](https://github.com/GMOD/twobit-js/commit/1cc6ed36f776ef404d339a447928df6612ca5a2e))

# [6.0.0](https://github.com/GMOD/twobit-js/compare/v4.0.1...v6.0.0) (2025-04-30)


### BREAKING CHANGES

* switch to `"type": "module"` with explicit dual `import`/`require` conditions in `exports`, so `dist/` and `esm/` are consumed correctly by CJS and ESM callers respectively
* bump `generic-filehandle2` to v2
* compile with TypeScript's `allowImportingTsExtensions`/`rewriteRelativeImportExtensions`, so source imports use `.ts` extensions directly

([eba9966](https://github.com/GMOD/twobit-js/commit/eba99668a26d1a421a0412178e3dc51ec08871e1))

## [4.0.1](https://github.com/GMOD/twobit-js/compare/v4.0.0...v4.0.1) (2024-12-12)

# [4.0.0](https://github.com/GMOD/twobit-js/compare/v3.0.1...v4.0.0) (2024-12-12)


### BREAKING CHANGES

* migrate from `generic-filehandle`/`buffer` to `generic-filehandle2`, whose `filehandle.read` returns a `Uint8Array` from `read(length, position)` instead of a Node `Buffer` from `read(buffer, offset, length, position)`; anyone passing a custom filehandle implementation needs to update it to the new signature
* drop the `buffer` polyfill dependency; sequence-name decoding now uses `TextDecoder` instead of `Buffer#toString`

([ffd526a](https://github.com/GMOD/twobit-js/commit/ffd526ac5acbc545f7f3e7e66423bf33d3cd17b2))

## [3.0.1](https://github.com/GMOD/twobit-js/compare/v2.0.1...v3.0.1) (2024-11-10)

- Refactor only: replace the `tinyMemoize` decorator (which took an `any`-typed class argument) with explicit per-method promise caching on `getHeader`/`getIndex` that clears itself on rejection, so a failed read can be retried rather than permanently caching the error ([abb4d52](https://github.com/GMOD/twobit-js/commit/abb4d520b5f565d5e9f3a5ecf611d5b37c82b3cf))

## [2.0.1](https://github.com/GMOD/twobit-js/compare/v2.0.0...v2.0.1) (2024-08-09)


### Bug Fixes

* import `Buffer` explicitly instead of relying on a bundler's automatic global polyfill, fixing `Buffer is not defined` under bundlers that don't provide one automatically (e.g. webpack 5, Vite) ([a0b9116](https://github.com/GMOD/twobit-js/commit/a0b91160e3472a305dd860054fb631f5261c8417))

# [2.0.0](https://github.com/GMOD/twobit-js/compare/v1.1.14...v2.0.0) (2024-08-09)

- Remove @gmod/binary-parser

## [1.1.14](https://github.com/GMOD/twobit-js/compare/v1.1.13...v1.1.14) (2022-07-18)

- Update generic-filehandle 2->3

<a name="1.1.13"></a>

## [1.1.13](https://github.com/GMOD/twobit-js/compare/v1.1.12...v1.1.13) (2022-03-30)

- Publish src directory for better source maps

<a name="1.1.12"></a>

## [1.1.12](https://github.com/GMOD/twobit-js/compare/v1.1.11...v1.1.12) (2021-12-14)

- Remove es6-promisify dependency

<a name="1.1.11"></a>

## [1.1.11](https://github.com/GMOD/twobit-js/compare/v1.1.10...v1.1.11) (2021-12-14)

- Typescriptify codebase and add esm build

<a name="1.1.10"></a>

## [1.1.10](https://github.com/GMOD/twobit-js/compare/v1.1.9...v1.1.10) (2019-10-06)

- Small refactor of `filehandle.read()` to make it more robust

## [1.1.9](https://github.com/GMOD/twobit-js/compare/v1.1.8...v1.1.9) (2019-05-25)

- Dependency updates for stability

## [1.1.8](https://github.com/GMOD/twobit-js/compare/v1.1.6...v1.1.8) (2019-04-04)

- Add @babel/runtime-corejs2 as a runtime dependency

## [1.1.7](https://github.com/GMOD/twobit-js/compare/v1.1.6...v1.1.7) (2019-04-03)

- Use core-js to polyfill Object.values instead of polyfill library

## [1.1.6](https://github.com/GMOD/twobit-js/compare/v1.1.5...v1.1.6) (2019-04-03)

- Change some settings so that babel runtimes do not collide

## [1.1.5](https://github.com/GMOD/twobit-js/compare/v1.1.4...v1.1.5) (2019-04-03)

- Fix some devDeps

## 1.1.4

- Updated to use babel7 and easier polyfills

## 1.1.3

- Bump versions to avoid some warnings

## 1.1.2

- Use @gmod/binary-parser

## 1.1.1

- Use babel-plugin-transform-runtime
- Use all unsigned ints

## 1.1.0

- Add support for 64-bit offsets

## 1.0.2

- Fix memory allocation

## 1.0.1

- Add browser support

## 1.0.0

- Initial version with basic twobit parsing
