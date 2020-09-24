const exploranda = require('exploranda-core');
const _ = require('lodash'); 

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

function dependencies({logGroupName, destinationBucket, destinationKey, year, month, day, startStamp, endStamp, runId}) {
  return {
    checkForRunning: {
      accessSchema: exploranda.dataSources.AWS.cloudwatchlogs.describeExportTasks,
      params: {
        apiConfig: {value: apiConfig},
      },
      behaviors: {
        retryParams: {
          times: 60,
          interval: 10000,
        },
        detectErrors: (err, res) => {
          console.log(err)
          console.log(JSON.stringify(res))
          status = _.map(res.exportTasks, 'status.code').filter((c) => c === "PENDING" || c === "RUNNING")
          if (status.length) {
            if (process.env.EXPLORANDA_DEBUG) {
              console.log(err)
              console.log(res)
            }
            return status
          }
        }
      }
    },
    createExport: {
      accessSchema: exploranda.dataSources.AWS.cloudwatchlogs.createExportTask,
      params: {
        apiConfig: {value: apiConfig},
        logGroupName: {
          source: 'checkForRunning',
          formatter: () => logGroupName,
        },
        from: {
          value: startStamp,
        },
        to: {
          value: endStamp,
        },
        destination: {
          value: destinationBucket,
        },
        destinationPrefix: {
          value: destinationKey,
        },
        taskName: {
          value: runId,
        },
      },
    },
    waitForFinished: {
      accessSchema: exploranda.dataSources.AWS.cloudwatchlogs.describeExportTasks,
      params: {
        apiConfig: {value: apiConfig},
      },
      behaviors: {
        retryParams: {
          times: 60,
          interval: 10000,
        },
        detectErrors: (err, res) => {
          console.log(err)
          console.log(JSON.stringify(res))
          status = _.map(res.exportTasks, 'status.code').filter((c) => c === "PENDING" || c === "RUNNING")
          if (status.length) {
            if (process.env.EXPLORANDA_DEBUG) {
              console.log(err)
              console.log(res)
            }
            return status
          }
        }
      }
    },
  };
}

exports.handler = function(event, context, callback) {
  console.log(JSON.stringify(event))
  const msgString = _.get(event, 'Records[0].body')
  console.log(msgString)
  const reporter = exploranda.Gopher(dependencies(JSON.parse(msgString)));
  reporter.report((e, n) => callback(e, JSON.stringify(n)));
}
