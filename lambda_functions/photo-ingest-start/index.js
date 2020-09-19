const exploranda = require('exploranda-core');
const _ = require('lodash');
const ExifReader = require('exifreader');
const zlib = require('zlib')
const uuid = require('uuid')

// Bucket for partitioned files, e.g. 'rluckom.timeseries'
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET
// prefix in bucket for partitioned files, e.g. 'partitioned/raphaelluckom.com'
const OUTPUT_PREFIX = process.env.OUTPUT_PREFIX

const apiConfig = {
  region: process.env.AWS_REGION
}

function dependencies(buckets, keys, eventTargets, mediaId) {
  console.log(buckets)
  console.log(keys)
  const functionInvocations = _.flattenDeep(_.map(_.zip(buckets, keys), ([bucket, key]) => {
    return _(eventTargets).map((et) => {
      let matches = false
      console.log(key)
      console.log(et.suffixes)
      if (_(et.suffixes).map((suffix) => _.endsWith(key, suffix)).some()) {
        matches = true
      }
      if (matches) {
        console.log(et.functionInvocations)
        return JSON.parse(
          JSON.stringify(et.functionInvocations)
          .replace(/\$bucket/g, bucket)
          .replace(/\$key/g, key)
          .replace(/\$mediaId/g, mediaId)
        )
      }
  }).filter().value()
  }))
  console.log(JSON.stringify(functionInvocations))
  console.log(_.map(functionInvocations, (fi) => JSON.stringify(fi.eventSchema)))
  return {
    invokeFunctions: {
      accessSchema: exploranda.dataSources.AWS.lambda.invoke,
      params: {
        FunctionName: {
          value: _.map(functionInvocations, 'functionArn')
        },
        InvocationType: {value: 'Event'},
        Payload: {
          value: _.map(functionInvocations, (fi) => JSON.stringify(fi.eventSchema))
        }
      }
    },
  }
}

exports.handler = function(event, context, callback) {
  const eventTargets = JSON.parse(process.env.MEDIA_EVENT_TARGETS)
  console.log(JSON.stringify(event))
  const keys = _.map(event.Records, 's3.object.key')
  const buckets = _.map(event.Records, 's3.bucket.name')
  console.log(eventTargets)
  const mediaId = uuid.v4()
  const reporter = exploranda.Gopher(dependencies(buckets, keys, eventTargets, mediaId));
  reporter.report((e, n) => callback(e, n));
}
