const exploranda = require('exploranda-core');
const _ = require('lodash'); 

// Original log bucket, e.g. 'logs.raphaelluckom.com'
const LOG_BUCKET = process.env.LOG_BUCKET 
// log prefix in original log bucket, e.g. 'raphaelluckom'
const LOG_PREFIX = process.env.LOG_PREFIX
// Bucket for partitioned logs, e.g. 'rluckom.timeseries'
const PARTITION_BUCKET = process.env.PARTITION_BUCKET
// prefix in bucket for partitioned logs, e.g. 'partitioned/raphaelluckom.com'
const PARTITION_PREFIX = process.env.PARTITION_PREFIX
// bucket in which to store Athena results with prefix, e.g. 's3://rluckom.athena'.
// seems to not work if it's a folder.
const ATHENA_RESULT_BUCKET = process.env.ATHENA_RESULT_BUCKET
// database in Athena / Glue to query, e.g. 'timeseries'
const ATHENA_DB = process.env.ATHENA_DB
// table in Athena / Glue to query, e.g. 'raphaelluckom_cf_logs_partitioned_gz'
const ATHENA_TABLE = process.env.ATHENA_TABLE
// catalog to use in Athena. For most queries this will be 'AwsDataCatalog'
const ATHENA_CATALOG = process.env.ATHENA_CATALOG || 'AwsDataCatalog'
const ATHENA_REGION = process.env.ATHENA_REGION

const apiConfig = {
  region: ATHENA_REGION
}

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
            Key: `${PARTITION_PREFIX}/year=${year}/month=${month}/day=${day}/hour=${hour}/E1Z2WGMVSWMMJ2.${date}.${uniqId}.gz`,
              year, month, day, hour
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
  addPartitions: {
    accessSchema: exploranda.dataSources.AWS.athena.startQueryExecution,
    params: {
      apiConfig: {value: apiConfig},
      QueryString: {
        source: 'prepCopy',
        formatter: ({prepCopy}) => {
          return prepCopy.map(({year, month, day, hour}) => {
            return `ALTER TABLE ${ATHENA_DB}.${ATHENA_TABLE}
            ADD IF NOT EXISTS 
            PARTITION (
              year = '${year}',
                month = '${month}',
                day = '${day}',
                hour = '${hour}' );`
          })
        },
      },
      QueryExecutionContext: {
        source: 'prepCopy',
        formatter: ({prepCopy}) => {
          if (!prepCopy.length) {
            return []
          }
          return {
            Catalog: ATHENA_CATALOG,
            Database: ATHENA_DB,
          }
        }
      },
      ResultConfiguration: {
        source: 'prepCopy',
        formatter: ({prepCopy}) => {
          if (!prepCopy.length) {
            return []
          }
          return {
            OutputLocation: ATHENA_RESULT_BUCKET,
          }
        }
      }
    },
  },
  waitForPartitions: {
    accessSchema: exploranda.dataSources.AWS.athena.getQueryExecution,
    params: {
      apiConfig: {value: apiConfig},
      QueryExecutionId: {
        source: 'addPartitions',
        formatter: ({addPartitions}) => addPartitions
      }
    },
    behaviors: {
      retryParams: {
        times: 60,
        interval: 10000,
        errorFilter: (err) => {
          return (err === 'QUEUED' || err === 'RUNNING')
        }
      },
      detectErrors: (err, res) => {
        status = _.get(res, 'QueryExecution.Status.State')
        if (status !== 'SUCCEEDED') {
          if (process.env.EXPLORANDA_DEBUG) {
            console.log(err)
          }
          return status
        }
      }
    }
  },
  partitionResults: {
    accessSchema: exploranda.dataSources.AWS.athena.getQueryResults,
    params: {
      apiConfig: {value: apiConfig},
      QueryExecutionId: {
        source: 'waitForPartitions',
        formatter: ({waitForPartitions}) => {
          return _.map(waitForPartitions, 'QueryExecutionId')
        }
      }
    },
  },
  copy: {
    accessSchema: exploranda.dataSources.AWS.s3.copyObject,
    params: {
      Bucket: {
        source: ['prepCopy', 'partitionResults'],
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
        formatter: ({prepCopy, copy}) => {
          if (prepCopy.length === copy.length) {
            return _.map(prepCopy, 'SourceKey')
          }
          throw new Error("Different number of copy and prepCopy steps, not deleting")
        }
      },
    }
  },

};

exports.handler = function(event, context, callback) {
  const reporter = exploranda.Gopher(dependencies);
  reporter.report((e, n) => callback(e, JSON.stringify(n)));
}
