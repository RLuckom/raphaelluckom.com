const exploranda = require('exploranda-core');
const _ = require('lodash'); 
const moment = require('moment')
const uuid = require('uuid')

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
const QUEUE_URL = process.env.QUEUE_URL

const apiConfig = {
  region: ATHENA_REGION
}

function dependencies({year, month, day, startStamp, endStamp, runId}) {
  return {
    groups: exploranda.dataSources.AWS.cloudwatchlogs.describeLogGroupsBuilder(apiConfig),
    logExports: {
      accessSchema: {
        dataSource: 'SYNTHETIC',
        transformation: ({groups}) => {
          return _.map(groups.groups, (g) => {
            const logGroupName = g.logGroupName
            const [start, aw, service, sourcename] = logGroupName.split('/')
            return {
              logGroupName,
              year,
              month,
              day,
              service,
              startStamp,
              endStamp,
              sourcename,
              runId,
              destinationBucket: PARTITION_BUCKET,
              destinationKey: `${PARTITION_PREFIX}/year=${year}/month=${month}/day=${day}/service=${service}/sourcename=${sourcename}/${runId}`
            }
          }).filter((g) => g.service && g.sourcename)
        }
      },
      params: {
        groups: {
        source: 'groups'
      }
    }
  },
  messages: {
      accessSchema: exploranda.dataSources.AWS.sqs.sendMessageBatch,
      params: {
        apiConfig: {value: apiConfig},
        QueueUrl: {value: QUEUE_URL},
        Entries: {
          source: "logExports",
          formatter: ({logExports}) => {
            return _.map(logExports, (le) => {
              return {
                Id: uuid.v4(),
                MessageBody: JSON.stringify(le)
              }
            })
          }
        }
      },
    },
    addPartitions: {
      accessSchema: exploranda.dataSources.AWS.athena.startQueryExecution,
      params: {
        apiConfig: {value: apiConfig},
        QueryString: {
          source: 'logExports',
          formatter: ({logExports}) => {
            return _.map(logExports, (le) => {
              return `ALTER TABLE ${ATHENA_DB}.${ATHENA_TABLE}
              ADD IF NOT EXISTS 
              PARTITION (
                  year = '${le.year}',
                  month = '${le.month}',
                  day = '${le.day}',
                  service = '${le.service}',
                  sourcename = '${le.sourcename}' );`
            })
          },
        },
        QueryExecutionContext: {
          value: {
            Catalog: ATHENA_CATALOG,
            Database: ATHENA_DB,
          }
        },
        ResultConfiguration: {
          value: {
            OutputLocation: ATHENA_RESULT_BUCKET,
          }
        }
      }
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
  };
}

exports.handler = function(event, context, callback) {
  const logDay = moment().subtract(2, 'days').startOf('day')
  const startStamp = logDay.valueOf()
  const endStamp = moment().subtract(2, 'days').endOf('day').valueOf()
  const year = logDay.year()
  const month = logDay.month()
  const day = logDay.date()
  const runId = uuid.v4()
  const period = {
    startStamp,
    endStamp,
    year,
    month,
    day,
    runId
  };
  const reporter = exploranda.Gopher(dependencies(period));
  reporter.report((e, n) => callback(e, JSON.stringify(n)));
}
