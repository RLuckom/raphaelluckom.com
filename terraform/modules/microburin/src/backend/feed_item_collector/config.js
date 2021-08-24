const _ = require('lodash')
const {streamDownloadAccessSchema} = require('./helpers/streamWriter')

module.exports = {
  stages: {
    parseRequest: {
      index: 0,
      transformers: {
        microburinSignature: { 
          helper: ({authHeader}) => {
            const parsedHeader = JSON.parse(Buffer.from(authHeader, 'base64').toString('utf8'))
            return {
              origin: parsedHeader.origin,
              recipient: parsedHeader.recipient
            }
          },
          params: {
            authHeader: {ref: 'event.headers.microburin-signature'}
          },
        },
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
        item: {
          action: 'exploranda',
          params: {
            accessSchema: {value: streamDownloadAccessSchema },
            explorandaParams: {
              presignedUrl: { ref: 'stage.body.presignedUrl' },
              bucket: { value: "${connection_item_bucket}" },
              key: {
                helper: ({postId, origin}) => {
                  return "${connection_item_prefix}" + origin + "/" + postId + '.zip'
                },
                params: {
                  origin: { ref: 'stage.microburinSignature.origin' },
                  postId: { ref: 'stage.body.postId' },
                },
              },
              requestTimeoutSecs: {value: ${request_timeout_secs} },
              sizeLimitBytes: {value: ${request_size_limit_mb} * 1024 * 1024 },
            }
          },
        },
        itemRecord: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.putItem'},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: '${connection_item_table_region}'}},
                TableName: {value: "${connection_item_table_name}"},
                Item: { 
                  helper: ({body, origin}) => {
                    return _.merge({}, body, {
                      '${connection_item_table_partition_key}': '${connection_item_table_kind}',
                      origin,
                    })
                  },
                  params: {
                    body: { ref: 'stage.body' },
                    origin: { ref: 'stage.microburinSignature.origin' },
                  }
                }
              }
            }
          }
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
      display: {
        helper: ({body, microburinSignature}) => {
          console.log(body)
          console.log(microburinSignature)
        },
        params: {
          body: { ref: 'parseRequest.vars.body' },
          microburinSignature: { ref: 'parseRequest.vars.microburinSignature' },
        }
      },
      statusCode: { value: 200},
    }
  }
}
