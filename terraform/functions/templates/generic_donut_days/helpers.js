const _ = require('lodash')

module.exports = {
  msTimestamp: () => {
    return new Date().getTime()
  },
  verifySlackSignature: ({credentials, messageSig, messageBody, timestampEpochSeconds}) => {
    const [v, sig] = messageSig.split('=')
    const hashInput = `${v}:${timestampEpochSeconds}:${messageBody}`
    const hmac = require('crypto').createHmac('sha256', credentials.signingSecret);
    hmac.update(hashInput)
    const digest = hmac.digest('hex')
    const hashValid = digest === sig
    const receiveTime = _.toInteger(new Date().getTime() / 1000)
    const sentTime = _.toInteger(timestampEpochSeconds)
    const ageSeconds = receiveTime - sentTime
    const timely = ageSeconds < 300
    return {
      result: hashValid && timely,
      hashValid,
      timely,
      details: {
        digest,
        sig,
        receiveTime,
        sentTime,
        ageSeconds,
      }
    }
  }
}
