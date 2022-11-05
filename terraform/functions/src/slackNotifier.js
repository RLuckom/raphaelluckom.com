const _ = require('lodash')
const AWS = require('aws-sdk')
const needle = require('needle')

const slackCredentialsParameter = process.env.SLACK_CREDENTIAL_PARAM
const slackChannel = process.env.SLACK_CHANNEL

function constructReadableError(evt) {
  const errString = `Error event sent to slack relay:\n${JSON.stringify(evt)}`
  return `Function: ${_.get(evt, 'requestContext.functionArn')}\nResult: ${_.get(evt, 'requestContext.condition')}\nRequestId: ${_.get(evt, 'requestContext.requestId')}\n${errString}`
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
