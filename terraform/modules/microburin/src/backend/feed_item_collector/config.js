const _ = require('lodash')
const {streamDownloadAccessSchema} = require('./helpers/streamWriter')

module.exports = {
  stages: {
    getConnections: {
      index: 0,
      transformers: {
        foo: {
          helper: ({evt}) => {
            console.log(evt)
            return evt
          },
          params: {
            evt: { ref: 'event' }
          }
        },
        saveConfigs: {
          helper: ({records}) => {
            return _.map(records, (r) => {
              return _.merge({
                key: "${connection_item_prefix}" + r.from + "/" + r.postId + '.zip',
              }, r)
            })
          },
          params: {
            records: { ref: 'event' }
          },
        }
      },
      dependencies: {
        tokens: {
          action: 'exploranda',
          params: {
            accessSchema: {value: streamDownloadAccessSchema },
            explorandaParams: {
              presignedUrl: {
                helper: ({records}) => {
                  return _.map(records, 'presignedUrl')
                },
                params: {
                  records: { ref: 'stage.saveConfigs' }
                },
              },
              bucket: { value: "${connection_item_bucket}" },
              key: {
                helper: ({records}) => {
                  return _.map(records, 'key')
                },
                params: {
                  records: { ref: 'stage.saveConfigs' }
                },
              },
              requestTimeoutSecs: {value: ${request_timeout_secs} },
              sizeLimitBytes: {value: ${request_size_limit_mb} * 1024 * 1024 },
            }
          },
        },
        /*
        connections: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.query'},
            explorandaParams: {
              apiConfig: {value: {region: '${connection_item_table_region}'}},
              TableName: {value: "${connection_item_table_name}"},
              ExpressionAttributeValues: {
                value: {
                  ':itemKind': '${connection_item_table_kind}',
                }
              },
              KeyConditionExpression: {value: '${connection_item_table_partition_key} = :itemKind' },
            },
          },
        },
       */
      }
    },
    /*
    signTokens: {
      index: 1,
      dependencies: {
      }
    },
    */
  },
  cleanup: {
    transformers: {
      // results: { ref: 'requestNewItems.results.items' }
    }
  }
}
