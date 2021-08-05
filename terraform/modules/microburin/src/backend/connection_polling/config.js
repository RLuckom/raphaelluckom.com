const _ = require('lodash')
const yaml = require('js-yaml')
const { signTokenAccessSchema, parseJwkAccessSchema } = require('./helpers/signRequests')

module.exports = {
  stages: {
    getConnections: {
      index: 0,
      dependencies: {
        connections: {
          accessSchema: {value: 'dataSources.AWS.dynamodb.query'},
          params: {
            apiConfig: {value: {region: '${connections_table_region}'}},
            TableName: {value: "${connections_table_name}"},
            ExpressionAttributeValues: {
              value: {
                ':mconnectionState': '${connection_status_code_connected}',
              }
            },
            KeyConditionExpression: {value: '${connection_table_state_key} = :connectionState' },
          },
        },
        signingKeyObject: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.getObject'},
            explorandaParams: {
              Bucket: {value: '${social_signing_private_key_bucket}'},
              Key: {value: '${social_signing_private_key_s3_key}'},
            }
          },
        },
      }
    },
    parseKey: {
      index: 1,
      dependencies: {
        key: {
          action: 'exploranda',
          params: {
            accessSchema: {value: parseJwkAccessSchema },
            explorandaParams: {
              keyObject: {ref: 'getConnections.results.signingKeyObject[0].Body'},
            }
          },
        },
      }
    },
    signTokens: {
      index: 2,
      dependencies: {
        tokens: {
          action: 'exploranda',
          params: {
            accessSchema: {value: signTokenAccessSchema },
            explorandaParams: {
              signingKey: {ref: 'parseKey.results.key[0]'},
              payload: {
                helper: ({connections, timestamp, origin}) => {
                  return _.map(connections, (c) => {
                    return {timestamp, origin, recipient: c.domain}
                  })
                },
                params: {
                  timestamp: { helper: () => { return new Date().getTime() }},
                  origin: { value: "${social_domain}" },
                  connections: { ref: 'getConnections.results.connections[0]' }'
                }
              }
            }
          },
        },
      }
    },
  },
  cleanup: {
    transformers: {
      results: { ref: 'signTokens.results.tokens' }
    }
  }
}
