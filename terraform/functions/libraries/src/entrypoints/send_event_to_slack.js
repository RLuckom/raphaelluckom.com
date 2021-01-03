const _ = require('lodash')
const AWS = require('aws-sdk')
const needle = require('needle')

const slackCredentialsParameter = process.env.SLACK_CREDENTIAL_PARAM
const slackChannel = process.env.SLACK_CHANNEL

function constructReadableError(evt) {
  const err = _.isString(_.get(evt, 'responsePayload')) ? JSON.parse(_.get(evt, 'responsePayload')) : _.get(evt, 'responsePayload')
  return `Function: ${_.get(evt, 'requestContext.functionArn')}\nResult: ${_.get(evt, 'requestContext.condition')}\nRequestId: ${_.get(evt, 'requestContext.requestId')}\nErrorType: ${_.get(err, 'errorType')}\nError Message: ${_.get(err, 'errorMessage')}\nStack trace --\n${_.get(err, 'trace[0]')}`
}

function main(event, context, callback) {
  new AWS.SSM().getParameter({
    Name: slackCredentialsParameter,
    WithDecryption: true,
  }, (e, r) => {
    let msg = JSON.stringify(event)
    const {token} = JSON.parse(r.Parameter.Value)
    const status = _.get(event, 'requestContext.condition')
    if (status !== 'Success') {
      try {
        msg = constructReadableError(event)
      } catch(e) {
        console.log(e)
      }
    }
    var options = {
      headers: { 'Authorization': `Bearer ${token}` }
    }
    needle.request('POST', 'https://slack.com/api/chat.postMessage', { channel: slackChannel, text: msg }, options, (e, r) => {
      console.log(e)
    })
  })
}

module.exports = {
  handler: main
}

