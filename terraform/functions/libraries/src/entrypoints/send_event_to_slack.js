const _ = require('lodash')
const AWS = require('aws-sdk')
const needle = require('needle')

const slackCredentialsParameter = process.env.SLACK_CREDENTIAL_PARAM
const slackChannel = process.env.SLACK_CHANNEL

function main(event, context, callback) {
  new AWS.SSM().getParameter({
    Name: slackCredentialsParameter,
    WithDecryption: true,
  }, (e, r) => {
    const {token} = JSON.parse(r.Parameter.Value)
    var options = {
      headers: { 'Authorization': `Bearer ${token}` }
    }
    needle.request('POST', 'https://slack.com/api/chat.postMessage', { channel: slackChannel, text: JSON.stringify(event) }, options, (e, r) => {
      console.log(e)
    })
  })
}

module.exports = {
  handler: main
}

