const _ = require('lodash')

function buildSlackAccessSchema({apiMethod, requiredBodyParams, optionalBodyParams, multipart}) {
  const bodyParamKeys = _.concat(requiredBodyParams || [], optionalBodyParams || [])
  return {
    dataSource: 'GENERIC_API',
    host: 'slack.com',
    path: `/api/${apiMethod}`,
    bodyParamKeys,
    multipart,
    method: 'POST',
    requiredParams: _.reduce(requiredBodyParams, (acc, v) => {
      acc[v] = {}
      return acc
    }, {
      apiConfig: {}
    }),
    optionalParams: _.reduce(optionalBodyParams, (acc, v) => {
      acc[v] = {}
      return acc
    }, {
      'content-type': {}
    }),
  }
}

const slackMethods = {
  getChannels: buildSlackAccessSchema({apiMethod: 'conversations.list'}),
  uploadBufferAsFile: buildSlackAccessSchema({apiMethod: 'files.upload', requiredBodyParams: ['file'], optionalBodyParams: ['channels'], multipart: true}),
  postMessage: buildSlackAccessSchema({apiMethod: 'chat.postMessage', requiredBodyParams: ['channel', 'text']})
}

module.exports = {
  slackMethods
}
