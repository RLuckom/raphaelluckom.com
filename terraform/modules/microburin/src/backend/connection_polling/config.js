const _ = require('lodash')
const { signTokenAccessSchema, parseJwkAccessSchema } = require('./helpers/signRequests')

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
              apiConfig: {value: {region: '${connections_table_region}'}},
              TableName: {value: "${connections_table_name}"},
              ExpressionAttributeValues: {
                value: {
                  ':connectionState': '${connection_status_code_connected}',
                }
              },
              KeyConditionExpression: {value: '${connection_table_state_key} = :connectionState' },
            },
          },
        },
        signingKeyObject: {
          action: 'exploranda',
          formatter: ({signingKeyObject}) => {
            console.log(signingKeyObject)
            return JSON.parse(signingKeyObject[0].Body.toString('utf8'))
          },
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
                  return _.map(connections, (c) => {
                    return {timestamp, origin, recipient: c.domain}
                  })
                },
                params: {
                  timestamp: { 
                    helper: () => { 
                      return new Date().getTime() 
                    }
                  },
                  origin: { value: "${social_domain}" },
                  connections: { ref: 'getConnections.results.connections[0]' }
                }
              }
            }
          },
        },
      }
    },
    requestNewItems: {
      index: 2,
      dependencies: {
        items: {
          action: 'genericApi',
          params: {
            mergeIndividual: _.identity,
            apiConfig: { 
              helper: ({tokens}) => {
                return _.map(tokens, ({timestamp, origin, recipient, sig}) => {
                  return {
                    url: "https://" + recipient + "${feed_list_path}",
                    token: Buffer.from(JSON.stringify({sig, timestamp, origin, recipient})).toString('base64')
                  }
                })
              },
              params: {
                tokens: { ref: 'signTokens.results.tokens' }
              }
            }
          }
        },
      }
    }
  },
  cleanup: {
    transformers: {
      results: { ref: 'requestNewItems.results.items' }
    }
  }
}
