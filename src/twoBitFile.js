const Parser = require('binary-parser').Parser

const TWOBIT_MAGIC = 0x1a412743
function tinyMemoize(_class, methodName) {
  const method = _class.prototype[methodName]
  const memoAttrName = `_memo_${methodName}`
  _class.prototype[methodName] = function _tinyMemoized() {
    if (!(memoAttrName in this)) this[memoAttrName] = method.call(this)
    return this[memoAttrName]
  }
}

class TwoBitFile {
  /**
   * @param {object} args
   * @param {Filehandle} args.filehandle node fs.promises filehandle for the .2bit file
   */
  constructor({ filehandle }) {
    this.filehandle = filehandle
    this.isBigEndian = undefined
  }

  /**
   * @param {string} seqName
   * @param {number} [start] optional 0-based half-open start of the sequence region to fetch. default 0.
   * @param {number} [end] optional 0-based half-open end of the sequence region to fetch. defaults to end of the sequence
   * @returns {Promise} promise for a string of sequence bases
   */
  async getSequence(seqName, start = 0, end) {}

  async _getParser(name) {
    return this._getParsers()[name]
  }

  // memoize
  async _getParsers() {
    await this._detectEndianness()

    const endianess = this.isBigEndian ? 'big' : 'little'
    return {
      header: new Parser()
        .endianess(endianess)
        .int32('magic', {
          assert: m => m === TWOBIT_MAGIC,
        })
        .int32('version', {
          assert: v => v === 0,
        })
        .int32('sequenceCount', {
          assert: v => v >= 0,
        })
        .int32('reserved'),
      index: new Parser()
        .endianess(endianess)
        .int32('sequenceCount')
        .int32('reserved')
        .array('index', {
          length: 'sequenceCount',
          type: new Parser()
            .endianess(endianess)
            .uint8('nameLength')
            .string('name', { length: 'nameLength' })
            .uint32('offset'),
        }),
      record: new Parser()
        .endianess(endianess)
        .int32('dnaSize')
        .int32('nBlockCount')
        .array('nBlockStarts', {
          length: 'nBlockCount',
          type: 'int32',
        })
        .array('nBlockSizes', {
          length: 'nBlockCount',
          type: 'int32',
        })
        .int32('maskBlockCount')
        .array('maskBlockStarts', {
          length: 'maskBlockCount',
          type: 'int32',
        })
        .array('maskBlockSizes', {
          length: 'maskBlockCount',
          type: 'int32',
        })
        .int32('reserved'),
      // .buffer('packedDna', { length: 'dnaSize' }),
    }
  }

  async _getHeader() {
    await this._detectEndianness()

    const buf = Buffer.allocUnsafe(16)
    await this.filehandle.read(buf, 0, 16, 0)

    const headerParser = await this._getParser('header')
    
  }
  /**
   * @returns async iterator of string sequence names
   */
  async *listSequences() {}
}

module.exports = TwoBitFile
