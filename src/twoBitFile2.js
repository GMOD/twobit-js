class Feature {
  constructor(args) {
    this.start = args.start
    this.end = args.end
    this.seq = args.seq
    this.seq_id = args.seq_id
  }

  get(field) {
    return this[field]
  }

  tags() {
    return ['seq_id', 'start', 'end', 'seq']
  }
}

const TWOBIT_MAGIC = [26, 65, 39, 67]

function hitchDeleteMe(context, func, args) {
  return func.bind(context, args)
}

class TwoBitFile {
  constructor(args) {
    this.numSeqs = 0

    this.byteSwapped = false
    this.data = args.data
    this.store = args.store
    this.maxChunkSize = args.maxChunkSize || 5000000

    this.chunkCache = {}
    this.headers = {}

    this.seqChunkSize = args.seqChunkSize || 5000
    this.seqHeader = []
  }

  init() {
    return new Promise((resolve, reject) => {
      this._read2bitHeader(() => {
        this._read2bitIndex(resolve, reject)
      }, reject)
    })
  }

  _read2bitHeader(successCallback, failCallback) {
    this.data.read(
      0,
      15,
      results => {
        const signature = this._toByteArray(results, 0, 4)
        if (!this._arrayEquals(signature, TWOBIT_MAGIC)) {
          if (this._arrayEquals(this.byteSwap(signature), TWOBIT_MAGIC)) {
            this.byteSwapped = true
          } else {
            failCallback('Not a 2bit file')
          }
          this.numSeqs = this._toInteger(results, 8, 12)
          successCallback()
        }
      },
      failCallback,
    )
  }

  _read2bitIndex(successCallback, failCallback) {
    this.chrToIndex = {}
    this.offset = []
    const maxLength = 256 // Since namesize is one byte, there are at most 256 bytes used for each name.
    if (this.numSeqs === 0) {
      successCallback()
      return
    }
    this.data.read(
      16,
      this.numSeqs * (maxLength + 5),
      results => {
        let i = 0
        for (let seqIndex = 0; seqIndex < this.numSeqs; seqIndex += 1) {
          const nameSize = this._toInteger(results, i, i + 1)
          i += 1
          const seqName = this._toString(results, i, i + nameSize)
          this.chunkCache[seqName] = []
          this.chrToIndex[seqName] = seqIndex
          i += nameSize
          this.offset[seqIndex] = this._toInteger(results, i, i + 4)
          i += 4
        }
        successCallback()
      },
      failCallback,
    )
  }

  _arrayEquals(array1, array2) {
    if (array1.length !== array2.length) return false
    for (let i = 0; i < array1.length; i += 1) {
      if (array1[i] !== array2[i]) return false
    }

    return true
  }

  _toString(arrayBuffer, start, end) {
    const byteArray = this._toByteArray(arrayBuffer, start, end)
    let retString = ''
    if (typeof byteArray === 'number') return String.fromCharCode(byteArray)
    for (let i = 0; i < byteArray.length; i += 1) {
      retString += String.fromCharCode(byteArray[i])
    }
    return retString
  }

  _toInteger(arrayBuffer, start, end) {
    let byteArray = this._toByteArray(arrayBuffer, start, end)
    if (this.byteSwapped) byteArray = this.byteSwap(byteArray)
    let retInt = 0
    for (let i = 0; i < byteArray.length; i += 1) {
      retInt += byteArray[i] << (8 * (byteArray.length - 1 - i))
    }
    return retInt
  }

  byteSwap(byteArray) {
    if (byteArray.length && byteArray.length > 1) {
      return byteArray.reverse()
    }
    return byteArray
  }

  _toByteArray(arrayBuffer, start, end) {
    const slicedArray =
      start !== undefined && end !== undefined
        ? arrayBuffer.slice(start, end)
        : start !== undefined
          ? arrayBuffer.slice(start)
          : arrayBuffer
    const typedArray = new Uint8Array(slicedArray)
    const retArray = []
    for (let i = 0; i < typedArray.length; i += 1) {
      retArray.push(typedArray[i])
    }
    return retArray
  }

  fetch(query, callback, endCallback, errorCallback) {
    errorCallback =
      errorCallback ||
      function(e) {
        console.error(e)
      }

    const seqName = query.ref

    if (!(seqName in this.chrToIndex) && endCallback) {
      endCallback()
      return
    }

    const callbackInfo = {
      query,
      seqFunc: this._fetchSequence.bind(this),
      callback,
      endCallback,
      errorCallback,
    }
    const seqHeader = this.headers[seqName]

    // Only gets the sequence header once, to save load time.  Caches it thereafter.
    if (seqHeader) {
      if (seqHeader.loaded) {
        this._fetchSequence(
          query,
          seqHeader,
          callback,
          endCallback,
          errorCallback,
        )
      } else if (seqHeader.error) {
        errorCallback(seqHeader.error)
      } else {
        seqHeader.callbacks.push(callbackInfo)
      }
    } else {
      this.headers[seqName] = {
        loaded: false,
        callbacks: [callbackInfo],
      }
      this._readSequenceHeader(
        seqName,
        hitchDeleteMe(
          this,
          (newHeader, header) => {
            Object.assign(newHeader, header)
            newHeader.loaded = true
            newHeader.callbacks.forEach(ci => {
              ci.seqFunc(
                ci.query,
                header,
                ci.callback,
                ci.endCallback,
                ci.errorCallback,
              )
            })
            delete newHeader.callbacks
          },
          this.headers[seqName],
        ),
        hitchDeleteMe(
          this,
          (newHeader, error) => {
            newHeader.error = error
            newHeader.callbacks.forEach(ci => {
              ci.errorCallback(error)
            })
            delete newHeader.callbacks
          },
          this.headers[seqName],
        ),
      )
    }
  }

  _readSequenceHeader(seqName, callback, errorCallback) {
    const index = this.chrToIndex[seqName]

    if (this.seqHeader[index]) callback(this.seqHeader[index])
    else {
      const headerStart = this.offset[index]

      this.data.read(
        headerStart,
        7,
        results => {
          let currData = headerStart
          const dnaSize = this._toInteger(results, 0, 4)
          const nBlockCount = this._toInteger(results, 4, 8)

          currData += 8

          const haveNBlocks = new Promise((resolve, reject) => {
            if (nBlockCount) {
              this.data.read(currData, 8 * nBlockCount - 1, resolve, reject)
            } else {
              resolve([])
            }
          })

          currData += 8 * nBlockCount

          const haveMasks = new Promise((resolve, reject) => {
            this.data.read(
              currData,
              4,
              rawMCount => {
                const maskBlockCount = this._toInteger(rawMCount, 0, 4)
                currData += 4
                if (maskBlockCount) {
                  this.data.read(
                    currData,
                    8 * maskBlockCount - 1,
                    maskBlockData => {
                      currData += 8 * maskBlockCount
                      haveMasks.resolve(maskBlockData)
                    },
                    errorCallback,
                  )
                } else {
                  resolve([])
                }
              },
              reject,
            )
          })

          Promise.all([haveNBlocks, haveMasks]).then(results => {
            currData += 4
            const header = {
              dnaSize,
              nBlockData: results[0],
              maskData: results[1],
              dnaStart: currData,
              dnaEnd: this.offset[index + 1],
            }
            this.seqHeader[index] = header
            callback(header)
          })
        },
        errorCallback,
      )
    }
  }

  _toBases(val) {
    const bitsToBase = ['T', 'C', 'A', 'G']
    const firstFour = (val >> 4) & 0xf
    const lastFour = val & 0xf

    const first = (firstFour >> 2) & 0x3
    const second = firstFour & 0x3
    const third = (lastFour >> 2) & 0x3
    const fourth = lastFour & 0x3

    const bitArray = [first, second, third, fourth]

    return bitArray.map(value => bitsToBase[value])
  }

  _toBaseString(byteArray) {
    let retString = ''
    for (let i = 0; i < byteArray.length; i += 1) {
      retString += this._toBases(byteArray[i]).join('')
    }
    return retString
  }

  _applyNBlocks(baseString, start, end, nBlocks) {
    let retString = baseString
    for (let i = 0; i < nBlocks.length; i += 1) {
      const blockStart = Math.max(0, nBlocks[i].start - start)
      let blockLength = nBlocks[i].size + Math.min(0, nBlocks[i].start - start)
      blockLength = Math.max(
        0,
        Math.min(blockLength, end - Math.max(nBlocks[i].start, start)),
      )
      retString = [
        retString.slice(0, blockStart),
        this._nBlock(blockLength),
        retString.slice(blockStart + blockLength),
      ].join('')
    }
    return retString
  }

  _applyMasks(baseString, start, end, masks) {
    let retString = baseString
    for (let i = 0; i < masks.length; i += 1) {
      const maskStart = Math.max(0, masks[i].start - start)
      let maskLength = masks[i].size + Math.min(0, masks[i].start - start)
      maskLength = Math.max(0, Math.min(maskLength, end - masks[i].start))
      retString = [
        retString.slice(0, maskStart),
        retString.slice(maskStart, maskStart + maskLength).toLowerCase(),
        retString.slice(maskStart + maskLength),
      ].join('')
    }
    return retString
  }

  _nBlock(length) {
    return Array(length + 1).join('N')
  }

  _getApplicable(blockBuffer, start, end) {
    const retArray = []

    const firstApplicable = this._findApplicable(blockBuffer, start, end)

    if (firstApplicable) {
      retArray.push(firstApplicable)
      let index = firstApplicable.index + 1
      while (index < blockBuffer.byteLength / 8) {
        const i = index * 4
        const j = i + blockBuffer.byteLength / 2

        const nextStart = this._toInteger(blockBuffer, i, i + 4)
        const nextSize = this._toInteger(blockBuffer, j, j + 4)

        if (nextStart <= end) {
          retArray.push({ start: nextStart, size: nextSize })
          index += 1
        } else {
          break
        }
      }

      index = firstApplicable.index - 1
      while (index >= 0) {
        const i = index * 4
        const j = i + blockBuffer.byteLength / 2
        const nextStart = this._toInteger(blockBuffer, i, i + 4)
        const nextSize = this._toInteger(blockBuffer, j, j + 4)

        if (nextStart + nextSize > start) {
          retArray.unshift({ start: nextStart, size: nextSize })
          index -= 1
        } else {
          break
        }
      }
    }

    return retArray
  }

  _findApplicable(blockBuffer, queryStart, queryEnd, blockStart, blockEnd) {
    if (blockEnd === undefined) blockEnd = (blockBuffer.byteLength || 0) / 8 - 1 // Buffer's size will always be divisible by 8 for masks or nBlocks
    if (blockStart === undefined) blockStart = 0

    if (blockStart > blockEnd) return undefined

    const sample = Math.floor((blockStart + blockEnd) / 2)
    const i = sample * 4
    const j = i + blockBuffer.byteLength / 2

    const sampleStart = this._toInteger(blockBuffer, i, i + 4)
    const sampleSize = this._toInteger(blockBuffer, j, j + 4)

    if (sampleStart + sampleSize > queryStart && sampleStart <= queryEnd) {
      return { start: sampleStart, size: sampleSize, index: sample }
    } else if (sampleStart > queryEnd) {
      return this._findApplicable(
        blockBuffer,
        queryStart,
        queryEnd,
        blockStart,
        sample - 1,
      )
    }
    return this._findApplicable(
      blockBuffer,
      queryStart,
      queryEnd,
      sample + 1,
      blockEnd,
    )
  }

  _fetchSequence(query, header, callback, endCallback, errorCallback) {
    let start =
      typeof query.start === 'number' ? query.start : parseInt(query.start, 10)

    const end =
      typeof query.end === 'number' ? query.end : parseInt(query.end, 10)

    start = Math.max(0, start)

    const chunkSize =
      query.seqChunkSize ||
      (this.refSeq &&
        this.refSeq.name === query.ref &&
        this.refSeq.seqChunkSize) ||
      this.seqChunkSize
    const firstChunk = Math.floor(Math.max(0, start) / chunkSize)
    const lastChunk = Math.floor((end - 1) / chunkSize)

    const seqname = query.ref

    // if a callback spans more than one chunk, we need to wrap the
    // callback in another one that will be passed to each chunk to
    // concatenate the different pieces from each chunk and *then*
    // call the main callback
    {
      const chunkSeqs = []
      let chunksStillNeeded = lastChunk - firstChunk + 1
      const origCallback = callback
      callback = (start, end, seq, chunkNum) => {
        chunkSeqs[chunkNum] = seq
        chunksStillNeeded -= 1
        if (chunksStillNeeded === 0) {
          origCallback(
            new Feature({
              seq_id: query.ref,
              start,
              end,
              seq: chunkSeqs.join(''),
            }),
          )
          if (endCallback) endCallback()
        }
      }
    }

    const callbackInfo = {
      start,
      end,
      success: callback,
      error: errorCallback,
    }

    if (!this.chunkCache[seqname]) {
      this.chunkCache[seqname] = []
    }

    const chunkCacheForSeq = this.chunkCache[seqname]

    for (let j = firstChunk; j <= lastChunk; j += 1) {
      // console.log("working on chunk %d for %d .. %d", i, start, end);

      const chunk = chunkCacheForSeq[j]
      if (chunk) {
        if (chunk.loaded) {
          callback(
            start,
            end,
            chunk.sequence.substring(
              start - j * chunkSize,
              end - j * chunkSize,
            ),
            j,
          )
        } else if (chunk.error) {
          errorCallback(chunk.error)
        } else {
          // console.log("added callback for %d .. %d", start, end);
          chunk.callbacks.push(callbackInfo)
        }
      } else {
        chunkCacheForSeq[j] = {
          loaded: false,
          num: j,
          callbacks: [callbackInfo],
        }

        const blockStart = j * chunkSize
        const blockEnd = Math.min(header.dnaSize, (j + 1) * chunkSize)

        const nBlocksToApply = this._getApplicable(
          header.nBlockData,
          blockStart,
          blockEnd,
        )
        const masksToApply = this._getApplicable(
          header.maskData,
          blockStart,
          blockEnd,
        )

        // dataStart and dataEnd are still in bp, so we must convert them to bytes.
        const byteStart = header.dnaStart + Math.floor(blockStart / 4)
        const sliceStart = blockStart % 4

        const byteEnd = header.dnaStart + Math.ceil(blockEnd / 4)
        const sliceEnd = sliceStart + (blockEnd - blockStart)

        const byteLength = byteEnd - byteStart - 1

        if (byteLength >= 0) {
          this.data.read(
            byteStart,
            byteLength,
            hitchDeleteMe(
              this,
              (chunkRecord, results) => {
                const byteArray = this._toByteArray(results)
                let baseString = this._toBaseString(byteArray)
                baseString = baseString.slice(sliceStart, sliceEnd)
                baseString = this._applyNBlocks(
                  baseString,
                  blockStart,
                  blockEnd,
                  nBlocksToApply,
                )
                baseString = this._applyMasks(
                  baseString,
                  blockStart,
                  blockEnd,
                  masksToApply,
                )
                chunkRecord.sequence = baseString
                chunkRecord.loaded = true
                chunkRecord.callbacks.forEach(ci => {
                  ci.success(
                    ci.start,
                    ci.end,
                    baseString.substring(
                      ci.start - chunkRecord.num * chunkSize,
                      ci.end - chunkRecord.num * chunkSize,
                    ),
                    chunkRecord.num,
                  )
                })

                delete chunkRecord.callbacks
              },
              chunkCacheForSeq[j],
            ),
            hitchDeleteMe(this, (chunkRecord, error) => {
              chunkRecord.error = error
              chunkRecord.callbacks.forEach(ci => {
                ci.error(error)
              })
              delete chunkRecord.callbacks
            }),
            chunkCacheForSeq[j],
          )
        }
      }
    }
  }
}

module.exports = TwoBitFile
