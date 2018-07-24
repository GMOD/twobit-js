const fs = require('fs-extra')

const TwoBitStore = require('../src/twoBitFile2')

class FilehandleBlob {
  constructor(fd) {
    this.fd = fd
  }

  read(position, length, cb, errCb) {
    const buf = Buffer.allocUnsafe(length)
    fs.read(this.fd, buf, 0, length, position).then(() => {
      cb(Uint8Array.from(buf))
    }, errCb)
  }
}

describe('.2bit data store with T_ko.2bit', () => {
  it('loads some data', async () => {
    const fd = await fs.open(require.resolve('./data/T_ko.2bit'), 'r')
    const t = new TwoBitStore({
      data: new FilehandleBlob(fd),
    })

    await t.init()

    let pythonReaderOutput =
      'ATGATCCTCGACACTGACTACATAACCGAGGATGGAAAGCCTGTCATAAGAATTTTCAAG AAGGAAAACGGCGAGTTTAAGATTGAGTACGACCGGACTTTTGAACCCTACTTCTACGCC CTCCTGAAGGACGATTCTGCCATTGAGGAAGTCAAGAAGATAACCGCCGAGAGGCACGGG ACGGTTGTAACGGTTAAGCGGGTTGAAAAGGTTCAGAAGAAGTTCCTCGGGAGACCAGTT GAGGTCTGGAAACTCTACTTTACTCATCCGCAGGACGTCCCAGCGATAAGGGACAAGATA CGAGAGCATCCAGCAGTTATTGACATCTACGAGTACGACATACCCTTCGCCAAGCGCTAC CTCATAGACAAGGGATTAGTGCCAATGGAAGGCGACGAGGAGCTGAAAATGCTCGCCTTC GACATTGAAACTCTCTACCATGAGGGCGAGGAGTTCGCCGAGGGGCCAATCCTTATGATA AGCTACGCCGACGAGGAAGGGGCCAGGGTGATAACTTGGAAGAACGTGGATCTCCCCTAC GTTGACGTCGTCTCGACGGAGAGGGAGATGATAAAGCGCTTCCTCCGTGTTGTGAAGGAG AAAGACCCGGACGTTCTCATAACCTACAACGGCGACAACTTCGACTTCGCCTATCTGAAA AAGCGCTGTGAAAAGCTCGGAATAAACTTCGCCCTCGGAAGGGATGGAAGCGAGCCGAAG ATTCAGAGGATGGGCGACAGGTTTGCCGTCGAAGTGAAGGGACGGATACACTTCGATCTC TATCCTGTGATAAGACGGACGATAAACCTGCCCACATACACGCTTGAGGCCGTTTATGAA GCCGTCTTCGGTCAGCCGAAGGAGAAGGTTTACGCTGAGGAAATAACCACAGCCTGGGAA ACCGGCGAGAACCTTGAGAGAGTCGCCCGCTACTCGATGGAAGATGCGAAGGTCACATAC GAGCTTGGGAAGGAGTTCCTTCCGATGGAGGCCCAGCTTTCTCGCTTAATCGGCCAGTCC CTCTGGGACGTCTCCCGCTCCAGCACTGGCAACCTCGTTGAGTGGTTCCTCCTCAGGAAG GCCTATGAGAGGAATGAGCTGGCCCCGAACAAGCCCGATGAAAAGGAGCTGGCCAGAAGA CGGCAGAGCTATGAAGGAGGCTATGTAAAAGAGCCCGAGAGAGGGTTGTGGGAGAACATA GTGTACCTAGATTTTAGATGCCATCCAGCCGATACGAAGGTTGTCGTCAAGGGGAAGGGG ATTATAAACATCAGCGAGGTTCAGGAAGGTGACTATGTCCTTGGGATTGACGGCTGGCAG AGAGTTAGAAAAGTATGGGAATACGACTACAAAGGGGAGCTTGTAAACATAAACGGGTTA AAGTGTACGCCCAATCATAAGCTTCCCGTTGTTACAAAGAACGAACGACAAACGAGAATA AGAGACAGTCTTGCTAAGTCTTTCCTTACTAAAAAAGTTAAGGGCAAGATAATAACCACT CCCCTTTTCTATGAAATAGGCAGAGCGACAAGTGAGAATATTCCAGAAGAAGAGGTTCTC AAGGGAGAGCTCGCTGGCATACTATTGGCTGAAGGAACGCTCTTGAGGAAAGACGTTGAA TACTTTGATTCATCCCGCAAAAAACGGAGGATTTCACACCAGTATCGTGTTGAGATAACC ATTGGGAAAGACGAGGAGGAGTTTAGGGATCGTATCACATACATTTTTGAGCGTTTGTTT GGGATTACTCCAAGCATCTCGGAGAAGAAAGGAACTAACGCAGTAACACTCAAAGTTGCG AAGAAGAATGTTTATCTTAAAGTCAAGGAAATTATGGACAACATAGAGTCCCTACATGCC CCCTCGGTTCTCAGGGGATTCTTCGAAGGCGACGGTTCAGTAAACAGGGTTAGGAGGAGT ATTGTTGCAACCCAGGGTACAAAGAACGAGTGGAAGATTAAACTGGTGTCAAAACTGCTC TCCCAGCTTGGTATCCCTCATCAAACGTACACGTATCAGTATCAGGAAAATGGGAAAGAT CGGAGCAGGTATATACTGGAGATAACTGGAAAGGACGGATTGATACTGTTCCAAACACTC ATTGGATTCATCAGTGAAAGAAAGAACGCTCTGCTTAATAAGGCAATATCTCAGAGGGAA ATGAACAACTTGGAAAACAATGGATTTTACAGGCTCAGTGAATTCAATGTCAGCACGGAA TACTATGAGGGCAAGGTCTATGACTTAACTCTTGAAGGAACTCCCTACTACTTTGCCAAT GGCATATTGACCCATAACTCCCTGTACCCCTCAATCATCATCACCCACAACGTCTCGCCG GATACGCTCAACAGAGAAGGATGCAAGGAATATGACGTTGCCCCACAGGTCGGCCACCGC TTCTGCAAGGACTTCCCAGGATTTATCCCGAGCCTGCTTGGAGACCTCCTAGAGGAGAGG CAGAAGATAAAGAAGAAGATGAAGGCCACGATTGACCCGATCGAGAGGAAGCTCCTCGAT TACAGGCAGAGGGCCATCAAGATCCTGGCAAACAGCATCCTACCCGAGGAATGGCTTCCA GTCCTCGAGGAAGGGGAGGTTCACTTCGTCAGGATTGGAGAGCTCATAGACCGGATGATG GAGGAAAATGCTGGGAAAGTAAAGAGAGAGGGCGAGACGGAAGTGCTTGAGGTCAGTGGG CTTGAAGTCCCGTCCTTTAACAGGAGAACTAAGAAGGCCGAGCTCAAGAGAGTAAAGGCC CTGATTAGGCACGATTATTCTGGCAAGGTCTACACCATCAGACTGAAGTCGGGGAGGAGA ATAAAGATAACCTCTGGCCACAGCCTCTTCTCTGTGAGAAACGGGGAGCTCGTTGAAGTT ACGGGCGATGAACTAAAGCCAGGTGACCTCGTTGCAGTCCCGCGGAGATTGGAGCTTCCT GAGAGAAACCACGTGCTGAACCTCGTTGAACTGCTCCTTGGAACGCCAGAAGAAGAAACT TTGGACATCGTCATGACGATCCCAGTCAAGGGTAAGAAGAACTTCTTTAAAGGGATGCTC AGGACTTTGCGCTGGATTTTCGGAGAGGAAAAGAGGCCCAGAACCGCGAGACGCTATCTC AGGCACCTTGAGGATCTGGGCTATGTCCGGCTTAAGAAGATCGGCTACGAAGTCCTCGAC TGGGACTCACTTAAGAACTACAGAAGGCTCTACGAGGCGCTTGTCGAGAACGTCAGATAC AACGGCAACAAGAGGGAGTACCTCGTTGAATTCAATTCCATCCGGGATGCAGTTGGCATA ATGCCCCTAAAAGAGCTGAAGGAGTGGAAGATCGGCACGCTGAACGGCTTCAGAATGAGC CCGCTCATTGAAGTGGACGAGTCGTTAGCAAAGCTCCTCGGCTACTACGTGAGCGAGGGC TATGCAAGAAAGCAGAGGAATCCCAAAAACGGCTGGAGCTACAGCGTGAAGCTCTACAAC GAAGACCCTGAAGTGCTGGACGATATGGAGAGACTCGCCAGCAGGTTTTTCGGGAAGGTG AGGCGGGGCAGGAACTACGTTGAGATACCGAAGAAGATCGGCTACCTGCTCTTTGAGAAC ATGTGCGGTGTCCTAGCGGAGAACAAGAGGATTCCCGAGTTCGTCTTCACGTCCCCGAAA GGGGTTCGGCTGGCCTTCCTTGAGGGGTACTTCATCGGCGATGGCGACGTCCACCCGAAC AAGAGACTCAGGCTCTCAACGAAAAGCGAGCTTTTAGCGAACCAGCTCGTCCTCCTCTTG AACTCGGTGGGGGTCTCTGCTGTAAAACTTGGGCACGACAGCGGCGTTTACAGGGTCTAT ATAAACGAGGAGCTCCCGTTCGTAAAGCTGGACAAGAAAAAGAACGCCTACTACTCACAC GTGATCCCCAAGGAAGTCCTGAGCGAGGTCTTTGGGAAGGTTTTCCAGAAAAACGTCAGT CCTCAGACCTTCAGGAAGATGGTCGAGGACGGAAGACTCGATCCCGAAAAGGCCCAGAGG CTCTCCTGGCTCATTGAGGGGGACGTAGTGCTCGACCGCGTTGAGTCCGTTGATGTGGAA GACTACGATGGTTATGTCTATGACCTGAGCGTCGAGGACAACGAGAACTTCCTCGTTGGC TTTGGGTTGGTCTATGCTCACAACAGCTACTACGGTTACTACGGCTATGCAAGGGCGCGC TGGTACTGCAAGGAGTGTGCAGAGAGCGTAACGGCCTGGGGAAGGGAGTACATAACGATG ACCATCAAGGAGATAGAGGAAAAGTACGGCTTTAAGGTAATCTACAGCGACACCGACGGA TTTTTTGCCACAATACCTGGAGCCGATGCTGAAACCGTCAAAAAGAAGGCTATGGAGTTC CTCAAGTATATCAACGCCAAACTTCCGGGCGCGCTTGAGCTCGAGTACGAGGGCTTCTAC AAACGCGGCTTCTTCGTCACGAAGAAGAAGTATGCGGTGATAGACGAGGAAGGCAAGATA ACAACGCGCGGACTTGAGATTGTGAGGCGTGACTGGAGCGAGATAGCGAAAGAGACGCAG GCGAGGGTTCTTGAAGCTTTGCTAAAGGACGGTGACGTCGAGAAGGCCGTGAGGATAGTC AAAGAAGTTACCGAAAAGCTGAGCAAGTACGAGGTTCCGCCGGAGAAGCTGGTGATCCAC GAGCAGATAACGAGGGATTTAAAGGACTACAAGGCAACCGGTCCCCACGTTGCCGTTGCC AAGAGGTTGGCCGCGAGAGGAGTCAAAATACGCCCTGGAACGGTGATAAGCTACATCGTG CTCAAGGGCTCTGGGAGGATAGGCGACAGGGCGATACCGTTCGACGAGTTCGACCCGACG AAGCACAAGTACGACGCCGAGTACTACATTGAGAACCAGGTTCTCCCAGCCGTTGAGAGA ATTCTGAGAGCCTTCGGTTACCGCAAGGAAGACCTGCGCTACCAGAAGACGAGACAGGTT GGTTTGAGTGCTTGGCTGAAGCCGAAGGGAACTTGACCTTTCCATTTGTTTTCCAGCGGA TAACCCTTTAACTTCCCTTTCAAAAACTCCCTTTAGGGAAAGACCATGAAGATAGAAATC CGGCGGCGCCCGGTTAAATACGCTAGGATAGAAGTGAAGCCAGACGGCAGGGTAGTCGTC ACTGCCCCCGAGGGGTTCAACGTTGAGAAGTTCATAGCAAAGAACGCCGCCTGGCTGGAG GGGAAGCTGGCCCAGATTGAAGGTCTGAAAGAGCTTGCAGAGTCGGGCTTTCCCCTGAAC GGCGAGTTCTACAAGGTCATACACGGAAGGAGGGCGAAAGTTCATGACAGCTTTAGGACC GTTGTTCTCCCCCCTTATCCCGAAGACATGCGGGAAGAACTGAAAAGGCTTCTCCGGCCG GAGATATTTGGGCTTATTGAAAAATACGCAGGAAAAATGGGAGTATCCCCCGGCAAGGTC TTCATCCGTTCGCAGAGGACAAGGTGGGGCAGCTGTTCTGGAAAGGGCAACCTGAACTTC AACCTTCGCCTGATAGCCCTTCCGCCGGAGCTCAGGGAGTACGTTGTCGTCCACGAGCTT GCTCACCTTAAGCACAGAAACCACTCAAAGGCCTTCTGGAGCCTTGTCTCCCGCTTCTAC CCGGACTACCGCTCCGCAAGGGAAGAGCTGAAGAAGTGGTGGAGCATTCTGGAGCTGAAC CCGTACTGGCGGTGGCTGGAGGGAAGGGAGTGACGCTGAAGGGAGTTTTAAAGCTCCTCC TTCTTTCAGCGGACGAAATAGCTGTCGCGGTCTTTATCTTTGTAGTTCTCCCCGGATTTG GGGTTGATGTGCCCTTGAAAGTATCCGTTCCACTTTTGGTGCTCCTGCTCCTCAAGGATA TTTTAATCGCCCCATACGTCCTCGGAGGCGGACTCGAAAAGAGGCCTTTAACTGGCCCTG AGGCTTTGATAGGGATGGAGGCGGTGGTCGTTGAAGACCTATCTCCAGAGGGTATCGTCA AAGTTGGGAACGAGCTGTGGAGAGGGGTCTGCTTAAACGGAAGGGCCAAGAGGGGAGAAA AAGTCAGGATCGTTGGATTCAGGGGGAACCTCCTACTACTGGAACGCCCAGAGTCCTGAG AACCTCTGCCAGCTCTTCGGGCCTGTTGGTGGTGAATGAGATGCTCCAGCCTTTAGTTCT TTCAATGAGAACGCAGGCCTTCCCTGGGTAAGTGTAGTGTATCGTCCCGCTGCAGCTCAT CCAGCCCTCTGAAATTCTGACGAGCTTTATCTCGTCGAGCCGGATCGTCTTTCTGGCGAG GAGACCGAGGGCACTTCTGATTTTCAGTCTCTCCTCATCCACTTCAATCTTTAGCTGCAT CAGGTCAAGGGCTATTGCCACAAACGGAAGAAGAAAAACGAGGAGAAACGTCATGTCTTC GCCTGCCAGGTATGAAGCTCCTATTCCTATGGTCATTCCTAGGAAGGCTGGGAGCATTAT GAGGAGCATCTTCCAGCTCCTGACGGTCTCGGAGTAGATGGCCACCACCGAGGGATTTTC CACTACCTCTTTAAAGCCCTTTTCCAAAGGTTACCAGGTGATAAGATGGTTCGGATAATG CCCGTTGACAGGCTGAGCGATGAGGAGGTAAGAGAAATTCTCACAAAGTACCGGAAGATA GCGCTCGTCGGCGCCTCACCAAAGCCGGAGCGCGATGCTAACAGGGTCATGCGCTATCTC CTCGAACACGGCTATGAGGTCTATCCCGTGAACCCGCGCTACGATGAGGTTCTCGGGAGG AAGTGCTATCCTAGCGTTCTTGACATCCCGGATGAGGTTGAAATCGTTGACCTCTTCGTT AGGCCAGAGTTCACTATGGACTACGTGGAACAGGCGATAAAGAAGGGTGCGAAGGTGGTC TGGTTCCAGTTCAACACCTACAACAGGGAGGCGTTCAGGAAAGCGAAAGAAGCGGGCCTT ACAGCAGTCGCTCACAGGTGCATAAAGCAGGAGCACGAGAGGCTTATCGGGTAATTCCAA GGAGCTCAAGGAGTTCTTTGGTGTTCACCACGTCAATCTCCTCTATTTCCTTCAGTCTCT TGTCGTTGTTCCACAGGGGGCTTTTACTTTTAGGGCCAGTGCCACAAAGTCAGCGTCATC TTTGTCGGGGGTTATTCGAGTGCTAGAGGTATGAACTCGGCGTAGAACCCCTCGTTTACG AATATGACATGCTCTTTAAGAACGGACAGTATTTCCTCGAACTCTTTCTCTCCGATCTTT GCTTTTTTCAGGACTTCGTCCCTGTGCTCGTGAAGCTCTTCCAGTGCAAACTCGGGACTT ATAAGTCTCCCTGATACCAAGAACACGAGCTCTCTGGTTACTGTTGATTTCCCGAAGAAA GAGAATAGCACGTTTGTGTTAACTACGAGAAGAATATCTTCTCTCAAGGTACTCGCCCCT TCCCATTTTCGCCTTCCGTCCGAGTTCTATTGCATCCTCTTCTGAGAGTTCGGAGTTCTT GAGCATCTCATTGAGCCTTGCGAGGGTTTTCAGTCTCTCCGCGATAGTCTTTGCTATCAA ATCGGCCAGCTTTTCGTCCACACTCGGGGGGACCTTGACCACTATGTCTCCCACGCTATC ACCGCTCTTACTACGCCGCTCTGCTTATAACGGTTTATCCTCTGTACCTCAGCACGTGGA TGTCCCTTACGACCCTGTGCCTCTCCTCGTAGTCAGGGTACCTCCCGAGGACTTCAAAGC CGAGCTTCACGAGCCACTTCCTCTCCTTCCGGTATATTCCACCGCCGCTCAGCTTGTAGG CCGGGAAGACAAAGACAACCTTTCCGTTTCTTTTCAGAACGTCGGCAAAGCTCTCGAAGA CCGAATAATAGAAGCGGTCGAGCTCGTTGGCCAGCTTTATGGCCTCGCCCCTACTCGGGT GTCTTTTGAGGGGCTTTCCGAGGTAGGGTTCGGTGACTATAGCATCGAACCTCTGTCTAA AACACTTCTTCAGCTTTCTGGCGTCGCAGACTTCTAAGTGAGCCGAGTTTTTGAGCCGGA ACTCTTTCCTCAGCCAGGTGAGATTCTTCTTGGCATCCCTGATCTGCCCCTCGTCGCGGT CGCTCCCGTAGGCAGTAAGCCCCTGAAGAACGAACTCCTGAACCACCGTTCCAATGCCGC AGAACGGATCCAGGAAGCTCCCCTTTCTAACCTCCGTCAGGTTCACCATTATCCTTGCCA GTCTCGGCGGAATCGAGAGGATGGGCTTCTGGACGGGCCTCTCGACGTCGAGCTTCTTCA GCTCGAAGGGGTCCGTTACTCTGATCGTCTCGCCGACGAGGAAGCTCCCGTCTTCCCTGA ACAGAAAGACGAAGTCCTTAACCTCCGGAAAGCCCTTGAGGATGAGCTCCGCGGGCATGG CATATGTTTTTGCGGGCTTGAAGAACTTAGCTGACCCCTCCTCTTTGAACCTCTTCTTTA TCTCGCTCCCGAGCTTACGCCAGAGCTTCCAGTCGCTCTTCCCGTAGAGACTGACCGTAA AAAGCCTGGAGTACTCCAGCTCCTCCAGAGCCTCTTCTCCCTCCCCAACTATCCTGACGA GCTTGAGAGAACCGCCTATCCACCGGAAATATCTCTCCACCGAAGGCTTGGATTCAAAGA CTATCCAGTTATGCTCTTCCTCAATCGATTTAACTTTTAGTCCGAATCTTCTCCCGAAAG AGTAAAATTCAGCACGGCTGAGCTCTGAATTCTTTCCTAAGATTACTCCATACATGGATT GCGCTTTGAGTAAGCTTTTAAAAAGGTTCCGCGTAAATATAATTGGGATTTAATCAAAAA CATGAGTCCACGGTGACCACCTATGCTGACGGTTGAGGTTCTTAAATCAGCTGACATCAT ACCTGATCCATATACGCGCGCGGTAACCTACGCCCGGTTAGGTGAGACGCTTGTGCGCAG GAAGGATCCCCTTTATAAGGAGGCGTTTTTGAAGGCGTTTGACGCGTTGAACGATATAAA CGATCCCGAACTTCTACTCAGGGCAACCCTAGCCATAGGGTACCACATGGGAAAAGCTGG GATCAAAGCGTACTACAAGGTGTTTCTGAGGGTGGTTGAAGATTCCTCTGCTTTATCTCC TCCAGTTAGAGACGAAATTTTAGCACTTGCCGTCAGGTACCTAGTGAGCCTCGGGAACCT CGGACAGGCCGTAACACTCGCGACGGAAATTTCGGATAAGAAACTTGCACAGGCCACTCT CTTCTCCATAGTCCGGGCGGGGAGCAGGTTAATTCAGGACAGCTCCCTAAAGGCGGCCTA CAAGCTCAGGAAAATCAAGCTGGCGCTTGAGTATATAACTGACGAGCCATATCGCTCAAA GGCCCTGATAGAGCTGGCAAAGGCTTTTATTGCGGTGGGGAGTTATGAGAGGGCGCTGGC CACGATTAGGGAAATAGAATCCCCAGATTGGGCTAAGGTTGCCTTCAAGGAACTTACCTT TAGTTTGGGCAGGATGGGCGTCATAGACAAGTTCATAAGCGGGCTTTCTGAGCTGGCGGA TGATTTCAGCTCGCGTTTTGGTGCCGATTTTGTTGTGGAGCTTGCAGAGGCTTTTCTGCT TGCTGGGAAACCGGATATTGCCGTTGGAATGCTCCGCAATCTTGATGATTCAGTTCAGGT GATCTCTGAAGTTGCACTTGAGGTTCTGGACAAAAATCCCGCGGTTATTCCGGGTTTTCT TGAAGTTCTCTCCGATGATGAGGCACGTATCGTTGGAAAGTTGTTGATGGATAAAATCCT TGAGCATCCGACAAAGGCCCTTGAGGAAGTTGTCAAGGCCGTGGCGAGGAGGGTTAGATC AGAAGCCATGTGGGTAAAGGTCGCCAGGTACTACACTCTGCTGGGGGACGTTGAGACGGC TAGAAATATCGGGGTTGTACTCCAGAATCCCAAGCTCCGCTCGATAGTTCTTGCGGACGT TGCCAGAAGTTACTTGAAACAGAACAAAATAGAAGAGGCC'
    pythonReaderOutput = pythonReaderOutput.replace(/\s/g, '')

    const features = []
    await new Promise((resolve, reject) => {
      t.fetch(
        { ref: 'chr1', start: 0, end: 10000 },
        feature => {
          features.push(feature)
        },
        resolve,
        reject,
      )
    })

    expect(t.byteSwapped).toBe(true)
    expect(features.length).toEqual(1)
    expect(features[0].seq.split('')).toEqual(pythonReaderOutput.split(''))
  })

  //   it('has correct behavior when refSeq not defined in file', () => {
  //     let done
  //     const features = []

  //     t.getFeatures(
  //       { ref: 'chr2', start: 0, end: 50000 },
  //       feature => {
  //         features.push(feature)
  //         console.log(feature)
  //       },
  //       () => {
  //         done = true
  //       },
  //     )

  //     expect(t.twoBit.byteSwapped).toBe(true)

  //     waitsFor(() => done, 2000)
  //     runs(() => {
  //       expect(features.length).toEqual(0)
  //     })
  //   })
  // })

  // describe('.2bit data store with volvox.2bit', () => {
  //   const t2 = new TwoBitStore({
  //     browser: new Browser({ unitTestMode: true }),
  //     blob: new XHRBlob('../data/volvox.2bit'),
  //   })

  //   it('constructs', () => {
  //     expect(t2).toBeTruthy()
  //   })

  //   it('loads some data', () => {
  //     let done
  //     const features = []

  //     t2.getFeatures(
  //       { ref: 'ctgA', start: 0, end: 50000 },
  //       feature => {
  //         features.push(feature)
  //       },
  //       () => {
  //         done = true
  //       },
  //     )

  //     waitsFor(() => done, 2000)

  //     runs(() => {
  //       expect(t2.twoBit.byteSwapped).toBe(true)
  //       expect(features.length).toEqual(1)
  //       expect(features[0].seq.length).toEqual(50000)
  //     })
  //   })

  //   it('loads some more data', () => {
  //     let done
  //     const features = []

  //     const seqFromFasta =
  //       'ACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGATACATGCTAGCTACGTGCATGCTCGACATGCATCATCAGCCTGATGCTGAT'
  //     t2.getFeatures(
  //       { ref: 'ctgB', start: 0, end: 5000 },
  //       feature => {
  //         features.push(feature)
  //       },
  //       () => {
  //         done = true
  //       },
  //     )

  //     expect(t2.twoBit.byteSwapped).toBe(true)

  //     waitsFor(() => done, 2000)
  //     runs(() => {
  //       expect(features.length).toEqual(1)
  //       expect(features[0].seq.length).toEqual(5000)
  //       expect(features[0].seq).toEqual(seqFromFasta)
  //     })
  //   })

  //   it('has correct behavior when refSeq not defined in file', () => {
  //     let done
  //     const features = []

  //     t2.getFeatures(
  //       { ref: 'nonexistent', start: 0, end: 50000 },
  //       feature => {
  //         features.push(feature)
  //       },
  //       () => {
  //         done = true
  //       },
  //     )

  //     waitsFor(() => done, 2000)
  //     runs(() => {
  //       expect(features.length).toEqual(0)
  //     })
  //   })
  // })

  // const seqString =
  //   'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNACTCTATCTATCTATCTATCTATCTTTTTCCCCCCGGGGGGagagagagactctagcatcctcctacctcacNNacCNctTGGACNCcCaGGGatttcNNNcccNNCCNCgN'

  // describe('.2bit data store with random data foo.2bit', () => {
  //   const t3 = new TwoBitStore({
  //     browser: new Browser({ unitTestMode: true }),
  //     blob: new XHRBlob('../data/foo.2bit'),
  //   })

  //   it('constructs', () => {
  //     expect(t3).toBeTruthy()
  //   })

  //   it('loads data properly (even with masks and N blocks)', () => {
  //     let done
  //     const features = []

  //     t3.getFeatures(
  //       { ref: 'chr1', start: 0, end: 159 },
  //       feature => {
  //         features.push(feature)
  //       },
  //       () => {
  //         done = true
  //       },
  //     )

  //     waitsFor(() => done, 2000)
  //     runs(() => {
  //       expect(features.length).toEqual(1)
  //       expect(features[0].seq.length).toEqual(159)
  //       expect(features[0].seq).toEqual(seqString)
  //     })
  //   })

  //   it("isn't fazed by being asked to look past the beginning or end of a sequence", () => {
  //     let done
  //     const features = []
  //     t3.getFeatures(
  //       { ref: 'chr1', start: -17, end: 300 },
  //       feature => {
  //         features.push(feature)
  //       },
  //       () => {
  //         done = true
  //       },
  //     )

  //     waitsFor(() => done, 2000)
  //     runs(() => {
  //       expect(features.length).toEqual(1)
  //       expect(features[0].seq.length).toEqual(159)
  //       expect(features[0].seq).toEqual(seqString)
  //     })
  //   })
  // })

  // describe('empty 2bit', () => {
  //   const t4 = new TwoBitStore({
  //     blob: new XHRBlob('../data/empty.2bit'),
  //   })

  //   it('constructs', () => {
  //     expect(t4).toBeTruthy()
  //   })

  //   it("returns no data, but doesn't crash", () => {
  //     let done
  //     const features = []
  //     t4.getFeatures(
  //       { ref: 'unimportant', start: 0, end: 4000 },
  //       feature => {
  //         features.push(feature)
  //       },
  //       () => {
  //         done = true
  //       },
  //       err => {
  //         console.log(err)
  //       },
  //     )

  //     waitsFor(() => done, 2000)
  //     runs(() => {
  //       expect(features.length).toEqual(0)
  //     })
  //   })
})
