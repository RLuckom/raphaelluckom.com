const { exploranda } = require('donut-days')

const nlpDependencyMap = {
  natural: 'natural',
  compromise: 'compromise',
}

const nlpRecordCollector = exploranda.buildSDKCollector({getApi: exploranda.genericFunctionRecordCollector, dependencyMap: nlpDependencyMap})

module.exports = {
  'NLP': nlpRecordCollector,
}
