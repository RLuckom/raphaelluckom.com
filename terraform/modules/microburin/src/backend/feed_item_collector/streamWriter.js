const _ = require('lodash')
const needle = require('needle')
const S3 = require('aws-sdk/clients/s3');

let s3Client

const streamDownloadAccessSchema = {
  dataSource: 'GENERIC_FUNCTION',
  namespaceDetails: {
    name: 'RequestSigner',
    paramDriven: true,
    parallel: true,
  },
  name: 'StreamDownload',
  requiredParams: {
    presignedUrl: {},
    bucket: {},
    key: {},
    requestTimeoutSecs: {},
    sizeLimitBytes: {},
  },
  params: {
    apiConfig: {
      apiObject: streamDownload,
    },
  }
};

function streamDownload({presignedUrl, bucket, key, requestTimeoutSecs, sizeLimitBytes}, callback) {
  if (!s3Client) {
    s3Client = new S3({})
  }
  const timeouts = {
    open_timeout: requestTimeoutSecs * 1000,
    response_timeout: requestTimeoutSecs * 1000,
    read_timeout: requestTimeoutSecs * 1000,
  }
  needle.get(presignedUrl, _.merge({headers: {range: "bytes=0-1"}}, timeouts), (err, res) => {
    if (err) {
      return callback(err)
    }
    const range = _.get(res, 'headers["content-range"]')
    if (!range) {
      callback("Could not get range header; response code" + res.statusCode)
      return
    }
    const contentLengthBytes = parseInt(range.split('/')[1])
    if (!contentLengthBytes || contentLengthBytes > sizeLimitBytes) { 
      callback("Content was not an acceptable size:" + contentLengthBytes)
      return
    }
    const stream = needle.get(presignedUrl, timeouts)
    s3Client.upload({
      Bucket: bucket,
      Key: key,
      Body: stream
    }, callback)
  })
}

module.exports = {
  streamDownload,
  streamDownloadAccessSchema,
}
