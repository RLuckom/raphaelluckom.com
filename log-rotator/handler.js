const exploranda = require('exploranda-core');
const _ = require('lodash'); // I know I'm going to need it

// Original log bucket, e.g. 'logs.raphaelluckom.com'
const LOG_BUCKET = process.env.LOG_BUCKET 
// log prefix in original log bucket, e.g. 'raphaelluckom'
const LOG_PREFIX = process.env.LOG_PREFIX
// Bucket for partitioned logs, e.g. 'rluckom.timeseries'
const PARTITION_BUCKET = process.env.PARTITION_BUCKET
// prefix in bucket for partitioned logs, e.g. 'partitioned/raphaelluckom.com'
const PARTITION_PREFIX = process.env.PARTITION_PREFIX

const dependencies = {
  objects: {
    accessSchema: exploranda.dataSources.AWS.s3.listObjects,
    params: {
      Bucket: {value: LOG_BUCKET},
      Prefix: {value: LOG_PREFIX}
    },
    formatter: (res, e) => {
      const flat = _.flatten(res)
      return res
    }
  },
  prepCopy: {
    accessSchema: {
      dataSource: 'SYNTHETIC',
      transformation: ({objects}) => {
        return _.map(_.flatten(objects.objects), (o) => {
          const [ignore, date, uniqId] = o.Key.match(/.*([0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2})\.(.*).gz/)
          const year = date.slice(0,4)
          const month = date.slice(5,7)
          const day = date.slice(8,10)
          const hour = date.slice(11,13)
          return {
            CopySource: `/${LOG_BUCKET}/${o.Key}`,
            SourceKey: `${o.Key}`,
            Key: `${PARTITION_PREFIX}/year=${year}/month=${month}/day=${day}/hour=${hour}/E1Z2WGMVSWMMJ2.${date}.${uniqId}.gz`
          }
        })
      },
      requiredParams: {
        objects: {}
      }
    },
    params: {
      objects: {
        source: 'objects',
      },
    }
  },
  copy: {
    accessSchema: exploranda.dataSources.AWS.s3.copyObject,
    params: {
      Bucket: {
        source: 'prepCopy',
        formatter: ({prepCopy}) => prepCopy.length ? PARTITION_BUCKET : []
      },
      CopySource: {
        source: 'prepCopy',
        formatter: ({prepCopy}) => _.map(prepCopy, 'CopySource')
      },
      Key: {
        source: 'prepCopy',
        formatter: ({prepCopy}) => _.map(prepCopy, 'Key')
      },
    },
  },
  delete: {
    accessSchema: exploranda.dataSources.AWS.s3.deleteObject,
    params: {
      Bucket: {
        source: 'prepCopy',
        formatter: ({prepCopy}) => prepCopy.length ? LOG_BUCKET : []
      },
      Key: {
        source: ['prepCopy', 'copy'],
        formatter: ({prepCopy, copy}) => _.map(copy, (cp, n) => prepCopy[n].SourceKey)
      },
    }
  },
};

exports.handler = function(event, context, callback) {
  const reporter = exploranda.Gopher(dependencies);
  reporter.report((e, n) => callback(e, JSON.stringify(n)));
}
