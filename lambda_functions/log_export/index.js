const {exploranda, createTask} = require('donut-days');
const _ = require('lodash'); 
const moment = require('moment')

const apiConfig = {
  region: process.env.AWS_REGION
}

function prepareLogExports({runId, partitionPrefix, logExportDestinationBucket}, addDependency, getDependencyName, processParams) {
  const groupDepName = addDependency('groups', exploranda.dataSources.AWS.cloudwatchlogs.describeLogGroupsBuilder(apiConfig))
  addDependency('exportTasks', {
      accessSchema: {
        dataSource: 'SYNTHETIC',
        transformation: ({groups}) => {
          const logDay = moment().subtract(2, 'days').startOf('day')
          const startStamp = logDay.valueOf()
          const endStamp = moment().subtract(2, 'days').endOf('day').valueOf()
          const year = logDay.year()
          const month = logDay.month()
          const day = logDay.date()
          const ret =  _.map(groups[groupDepName], (g) => {
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
              destinationBucket: logExportDestinationBucket,
              destinationKey: `${partitionPrefix}/year=${year}/month=${month}/day=${day}/service=${service}/sourcename=${sourcename}/${runId}`
            }
          }).filter((g) => g.service && g.sourcename)
          console.log(JSON.stringify(ret))
          return ret;
        }
      },
      params: {
        groups: {
        source: groupDepName
      }
    }
  })
}

function insertAthenaPartitions({exportTask, athenaCatalog, athenaDb, athenaTable, athenaResultBucket, dryRun}, addDependency, getDependencyName, processParams) {
  const addPartitionsDepName = addDependency('addPartitions', {
    accessSchema: exploranda.dataSources.AWS.athena.startQueryExecution,
    params: {
      apiConfig: {value: {region: process.env.AWS_REGION}},
      QueryString: {
        source: exportTask,
        formatter: (params) => {
          return _.map(params[exportTask], (le) => {
            return `ALTER TABLE ${athenaDb}.${athenaTable}
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
          Catalog: athenaCatalog || "AwsDataCatalog",
          Database: athenaDb,
        }
      },
      ResultConfiguration: {
        value: {
          OutputLocation: athenaResultBucket,
        }
      }
    }
  }, dryRun)
  const waitForPartitionsDepName = addDependency('waitForPartitions', {
    accessSchema: exploranda.dataSources.AWS.athena.getQueryExecution,
    params: {
      apiConfig: {value: {region: process.env.AWS_REGION}},
      QueryExecutionId: {
        source: addPartitionsDepName,
        formatter: (params) => params[addPartitionsDepName]
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
        const status = _.get(res, 'QueryExecution.Status.State')
        if (status !== 'SUCCEEDED') {
          if (process.env.EXPLORANDA_DEBUG) {
            console.log(err)
          }
          return status
        }
      }
    }
  }, dryRun)
  addDependency('partitionResults', {
    accessSchema: exploranda.dataSources.AWS.athena.getQueryResults,
    params: {
      apiConfig: {value: {region: process.env.AWS_REGION}},
      QueryExecutionId: {
        source: waitForPartitionsDepName,
        formatter: (params) => {
          return _.map(params[waitForPartitionsDepName], 'QueryExecutionId')
        }
      }
    },
  }, dryRun)
}

const donutDaysConfig = JSON.parse(process.env.DONUT_DAYS_CONFIG || "{}")
exports.handler = createTask(donutDaysConfig, {}, {prepareLogExports, insertAthenaPartitions})