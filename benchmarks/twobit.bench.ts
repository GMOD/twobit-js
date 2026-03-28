import { readFileSync } from 'node:fs'
import { bench, describe } from 'vitest'

import { TwoBitFile as TwoBitFileBranch1 } from '../esm_branch1/index.js'
import { TwoBitFile as TwoBitFileBranch2 } from '../esm_branch2/index.js'

const branch1Name = readFileSync('esm_branch1/branchname.txt', 'utf8').trim()
const branch2Name = readFileSync('esm_branch2/branchname.txt', 'utf8').trim()

function benchTwoBit(
  name: string,
  path: string,
  seqName: string,
  start: number,
  end: number,
  opts?: { iterations?: number; warmupIterations?: number },
) {
  describe(name, () => {
    bench(
      branch1Name,
      async () => {
        const t = new TwoBitFileBranch1({ path })
        await t.getSequence(seqName, start, end)
      },
      opts,
    )

    bench(
      branch2Name,
      async () => {
        const t = new TwoBitFileBranch2({ path })
        await t.getSequence(seqName, start, end)
      },
      opts,
    )
  })
}

function benchTwoBitGetSequenceSizes(
  name: string,
  path: string,
  opts?: { iterations?: number; warmupIterations?: number },
) {
  describe(name, () => {
    bench(
      branch1Name,
      async () => {
        const t = new TwoBitFileBranch1({ path })
        await t.getSequenceSizes()
      },
      opts,
    )

    bench(
      branch2Name,
      async () => {
        const t = new TwoBitFileBranch2({ path })
        await t.getSequenceSizes()
      },
      opts,
    )
  })
}

benchTwoBit(
  'volvox.2bit small region',
  'test/data/volvox.2bit',
  'ctgA',
  0,
  100,
  {
    iterations: 10000,
    warmupIterations: 500,
  },
)
benchTwoBit('T_ko.2bit large region', 'test/data/T_ko.2bit', 'chr1', 0, 50000, {
  iterations: 1000,
  warmupIterations: 50,
})

benchTwoBitGetSequenceSizes(
  'out2.2bit getSequenceSizes (10000 seqs)',
  'test/data/out2.2bit',
  {
    iterations: 20,
    warmupIterations: 2,
  },
)

benchTwoBitGetSequenceSizes(
  'out2.long.2bit getSequenceSizes (10000 seqs)',
  'test/data/out2.long.2bit',
  {
    iterations: 20,
    warmupIterations: 2,
  },
)
