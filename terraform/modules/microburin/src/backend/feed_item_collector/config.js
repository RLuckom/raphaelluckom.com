const _ = require('lodash')
const m = require('./helpers/streamWriter')

module.exports = {
  stages: {
    getConnections: {
      index: 0,
      dependencies: {
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
      }
    },
    /*
    signTokens: {
      index: 1,
      dependencies: {
        tokens: {
          action: 'exploranda',
          params: {
            accessSchema: {value: signTokenAccessSchema },
            explorandaParams: {
              signingKeyObject: {ref: 'getConnections.results.signingKeyObject'},
              payload: {
                helper: ({connections, timestamp, origin}) => {
                  const ret = _.map(connections, (c) => {
                    return {timestamp, origin, recipient: c.domain}
                  })
                  return ret
                },
                params: {
                  timestamp: { 
                    helper: () => { 
                      return new Date().getTime() 
                    }
                  },
                  connections: { ref: 'getConnections.results.connections' }
                }
              }
            }
          },
        },
      }
    },
    */
  },
  cleanup: {
    transformers: {
      results: { ref: 'requestNewItems.results.items' }
    }
  }
}
