const {exploranda, createTask} = require('donut-days');
const _ = require('lodash'); 
const config = require('./config')
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
          console.log(JSON.stringify(params))
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

function performExport({exportTask, dryRun}, addDependency, getDependencyName, processParams) {
  addDependency('checkForRunning', {
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
        const status = _.map(res.exportTasks, 'status.code').filter((c) => c === "PENDING" || c === "RUNNING")
        if (status.length) {
          if (process.env.DONUT_DAYS_DEBUG) {
            console.log(err)
            console.log(res)
          }
          return status
        }
      }
    }
  }, dryRun)

  addDependency('createExport', {
    accessSchema: exploranda.dataSources.AWS.cloudwatchlogs.createExportTask,
    params: {
      apiConfig: {value: apiConfig},
      logGroupName: {
        source: getDependencyName('checkForRunning'),
        formatter: () => exportTask.logGroupName,
      },
        from: {
          value: exportTask.startStamp,
        },
        to: {
          value: exportTask.endStamp,
        },
        destination: {
          value: exportTask.destinationBucket,
        },
        destinationPrefix: {
          value: exportTask.destinationKey,
        },
        taskName: {
          value: exportTask.runId,
        },
    },
  }, dryRun)

  addDependency('waitForFinished', {
    accessSchema: exploranda.dataSources.AWS.cloudwatchlogs.describeExportTasks,
    params: {
      apiConfig: {
        source: getDependencyName('createExport'),
        formatter: () => apiConfig,
      }
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
  }, dryRun)
}

exports.handler = createTask(config, {}, {prepareLogExports, insertAthenaPartitions, performExport})
