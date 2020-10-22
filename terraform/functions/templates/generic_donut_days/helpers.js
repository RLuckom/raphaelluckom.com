const _ = require('lodash')

module.exports = {
  bufferToString: ({buffer, encoding}) => buffer.toString(encoding)
}
