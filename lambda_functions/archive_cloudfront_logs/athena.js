const exploranda = require('exploranda-core');
const _ = require('lodash'); 

// bucket in which to store Athena results, e.g. 'rluckom.athena'
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
  addPartitions: {
    accessSchema: exploranda.dataSources.AWS.athena.startQueryExecution,
    params: {
      apiConfig: {value: apiConfig},
      QueryString: {
        value: [
          'SELECT * FROM "timeseries"."raphaelluckom_cf_logs_partitioned_gz" limit 100;',
          'SHOW CREATE TABLE raphaelluckom_cf_logs_partitioned_gz;'
        ]
      },
      QueryExecutionContext: {
        value:{
          Catalog: ATHENA_CATALOG,
          Database: ATHENA_DB,
        }
      },
      ResultConfiguration: {
        value:{
          OutputLocation: ATHENA_RESULT_BUCKET,
        }
      },
    },
  },
  waitForPartitions: {
    accessSchema: exploranda.dataSources.AWS.athena.getQueryExecution,
    params: {
      apiConfig: {value: apiConfig},
      QueryExecutionId: {
        source: 'addPartitions',
        formatter: ({addPartitions}) => {
          return addPartitions
        }
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

const reporter = exploranda.Gopher(dependencies);
reporter.report((e, n) => {
  console.log(e)
  console.log(JSON.stringify(n))
});
