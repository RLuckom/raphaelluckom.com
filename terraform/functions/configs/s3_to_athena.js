const _ = require('lodash')
const {utils} = require('./helpers/formatters')
const { parseKeyDate, athenaPartitionQuery } = require('./helpers/athenaHelpers')

module.exports = {
  stages: {
    addPartitions: {
      index: 0,
      dependencies: {
        partitions: {
          action: 'exploranda',
          params: {
            accessSchema: 'dataSources.AWS.athena.startQueryExecution',
            explorandaParams: {
              apiConfig: {value: {region: '${athena_region}'}},
              QueryString: {
                helper: 'transform',
                params: {
                  arg: {
                    all: {
                      athenaDb: {value: '${athena_db}'},
                      athenaTable: {value: '${athena_table}'},
                      date: {ref: 'event.Records[0].s3.object.key'},
                    },
                  },
                  func: athenaPartitionQuery,
                }
              },
              QueryExecutionContext: {
                value: {
                  Catalog: '${athena_catalog}',
                  Database: '${athena_db}',
                }
              },
              ResultConfiguration: {
                value: {
                  OutputLocation: '${athena_result_bucket}',
                }
              }
            }
          },
        },
      },
    },
    waitForPartitions: {
      index: 1,
      dependencies: {
        completion: {
          action: 'exploranda',
          formatter: formatters.singleValue.unwrap,
          params: {
            accessSchema: 'dataSources.AWS.athena.getQueryExecution',
            explorandaParams: {
              apiConfig: {value: {region: '${athena_region}'}},
              QueryExecutionId: { ref: 'addPartitions.results.partitions'} 
            },
            behaviors: {
              value: {
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
            },
          }
        },
      },
    },
    partitionResults: {
      index: 2,
      dependencies: {
        partitionResults: {
          action: 'exploranda',
          formatter: formatters.singleValue.unwrap,
          params: {
            accessSchema: 'dataSources.AWS.athena.getQueryResults',
            explorandaParams: {
              apiConfig: {value: {region: '${athena_region}'}},
              QueryExecutionId: {
                helper: 'transform',
                params: {
                  arg: { ref: 'waitForPartitions.results.completion' },
                  func: (completion) => {
                  return _.map(completion, 'QueryExecutionId')
                }
              }
            }
          },
        }
      },
    },
    copy: {
      index: 3,
      transformers: {
        destKey: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                key: {ref: 'event.Records[0].s3.object.key'},
              }
            },
            func: ({key}) => {
              const { date, uniqId, year, month, day, hour } = parseKeyDate(key)
              return utils.createDatedS3Key("${partition_prefix}",  date + '.' + uniqId + '.gz', { year, month, day, hour })
            },
          }
        },
        copySource: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                bucket: {ref: 'event.Records[0].s3.bucket.name'},
                key: {ref: 'event.Records[0].s3.object.key'},
              }
            },
            func: ({bucket, key}) => '/' + bucket + '/' + key
          },
        }
      }, 
      dependencies: {
        copy: {
          action: 'exploranda',
          params: {
            accessSchema: 'dataSources.AWS.s3.copyObject',
            explorandaParams: {
              Bucket: '${partition_bucket}',
              CopySource: {ref: 'stage.copySource'},
              Key: { ref: 'stage.destKey'} 
            }
          },
        }
      },
    },
    delete: {
      index: 4,
      dependencies: {
        delete: {
          action: 'exploranda',
          params: {
            accessSchema: exploranda.dataSources.AWS.s3.deleteObject,
            explorandaParams: {
              Bucket: {ref: 'event.Records[0].s3.bucket.name'},
              Key: {ref: 'event.Records[0].s3.object.key'},
            },
          }
        },
      }
    }
  }
}
