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
              IndexName: {value: "${connection_table_state_index}"},
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
      transformers: {
        body: {
          helper: ({evt}) => {
            return JSON.stringify(evt)
          },
          params: {
            evt: { ref: 'event'}
          }
        }
      },
      dependencies: {
        tokens: {
          action: 'exploranda',
          params: {
            accessSchema: {value: signTokenAccessSchema },
            explorandaParams: {
              signingKeyObject: {ref: 'getConnections.results.signingKeyObject'},
              body: { ref: 'stage.body'},
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
                  origin: { value: "${social_domain}" },
                  connections: { ref: 'getConnections.results.connections' }
                }
              }
            }
          },
        },
      }
    },
    sendNotification: {
      index: 2,
      dependencies: {
        items: {
          action: 'exploranda',
          params: {
            accessSchema: {value: {
              name: 'POST url',
              dataSource: 'GENERIC_API',
              method: 'POST',
              headerParamKeys: ['Microburin-Signature'],
              bodyParamKeys: ['body'],
              requestBodyBuilder: ({body}) => {
                return body
              }
            }},
            explorandaParams: {
              apiConfig: {
                helper: ({tokens}) => {
                  return _.map(tokens, ({timestamp, origin, recipient, sig}) => {
                    return {
                      url: "https://" + recipient + "/${incoming_notification_api_path}",
                    }
                  })
                },
                 params: {
                   tokens: { ref: 'signTokens.results.tokens' },
                 }
              },
              body: { ref: 'signTokens.vars.body' },
              'Microburin-Signature': {
                helper: ({tokens}) => {
                  const ret = _.map(tokens, ({timestamp, origin, recipient, sig, bodySig}) => {
                    return Buffer.from(JSON.stringify({sig, bodySig, timestamp, origin, recipient})).toString('base64')
                  })
                  return ret
                },
                params: {
                  tokens: { ref: 'signTokens.results.tokens' }
                }
              }
            }
          }
        }
      }
    },
  },
}
