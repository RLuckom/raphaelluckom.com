const _ = require('lodash')
const AWS = require('aws-sdk')
const needle = require('needle')

const slackCredentialsParameter = process.env.SLACK_CREDENTIAL_PARAM
const slackChannel = process.env.SLACK_CHANNEL

function constructReadableError(evt) {
  const err = _.isString(_.get(evt, 'responsePayload')) ? JSON.parse(_.get(evt, 'responsePayload')) : _.get(evt, 'responsePayload')
  let errString
  let logLocation = `s3://{bucket}/{prefix}/${createDatedS3Key(null, _.get(evt, 'requestContext.requestId'))}`
  if (err) {
    errString = `ErrorType: ${_.get(err, 'errorType')}\nError Message: ${_.get(err, 'errorMessage')}\nStack trace --\n${_.get(err, 'trace[0]')}`
  } else {
    errString = `Error was not recognized: full event --\n${JSON.stringify(evt)}`
  }
  return `Function: ${_.get(evt, 'requestContext.functionArn')}\nResult: ${_.get(evt, 'requestContext.condition')}\nRequestId: ${_.get(evt, 'requestContext.requestId')}\nLikely Logs: ${logLocation}\n${errString}`
}

function createDatedS3Key(prefix, suffix, date) {
  date = _.isString(date) ? Date.parse(date) : (date instanceof Date ? date : new Date())
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hour = date.getUTCHours()
  return `${_.trimEnd(prefix, '/')}${prefix ? '/' : ''}year=${year}/month=${month}/day=${day}/hour=${hour}/${suffix || 'undefined'}.log`
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

