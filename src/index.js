const values = require('object.values')

if (!Object.values) {
  values.shim()
}

const TwoBitFile = require('./twoBitFile')

module.exports = { TwoBitFile }
