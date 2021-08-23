const _ = require('lodash')
const {streamDownloadAccessSchema} = require('./helpers/streamWriter')

module.exports = {
  stages: {
    parseRequest: {
      index: 0,
      transformers: {
        microburinSignature: { 
          helper: ({authHeader}) => {
            return JSON.parse(Buffer.from(authHeader, 'base64').toString('utf8'))
          },
          params: {
            authHeader: {ref: 'event.headers.microburin-signature'}
          },
        }
        body: {
          helper: ({body}) => {
            if (body) {
              return JSON.parse(body)
            }
          },
          params: {
            body: { ref: 'event.body' }
          },
        }
      },
      dependencies: {
        /*
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
      body: { ref: 'parseRequest.vars.body' },
      microburinSignature: { ref: 'parseRequest.vars.microburinSignature' },
    }
  }
}
