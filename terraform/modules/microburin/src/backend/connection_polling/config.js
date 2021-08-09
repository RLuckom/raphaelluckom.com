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
    requestNewItems: {
      index: 2,
      dependencies: {
        items: {
          action: 'genericApi',
          params: {
            mergeIndividual: _.identity,
            apiConfig: {
              helper: ({tokens}) => {
                const ret = _.map(tokens, ({timestamp, origin, recipient, sig}) => {
                  return {
                    url: "https://" + recipient + "${feed_list_path}",
                    token: Buffer.from(JSON.stringify({sig, timestamp, origin, recipient})).toString('base64')
                  }
                })
                return ret
              },
              params: {
                tokens: { ref: 'signTokens.results.tokens' }
              }
            }
          }
        },
      }
    },
    distributeGetRequests: {
      index: 3,
      transformers: {
        results: {
          helper: ({returned, tokens}) => {
            return _.map(_.zip(returned, tokens), ([r, t]) => {
              const parsed = JSON.parse(r.body)
              return _.map(parsed, (item) => {
                return _.merge({
                  from: t.recipient,
                }, item)
              })
            })
          },
          params: {
            returned: { ref: 'requestNewItems.results.items' },
            tokens: { ref: 'signTokens.results.tokens' }
          }
        }
      },
      dependencies: {
        delegate: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.lambda.invoke'},
            explorandaParams: {
              FunctionName: { value: '${delegation_function_name}' },
              InvocationType: { value: 'Event' },
              Payload: {
                helper: ({results}) => {
                  return _.map(results, (r) => JSON.stringify(r))
                },
                params: {
                  results: { ref: 'stage.results' },
                }
              }
            }
          }
        }
      }
    }
  },
  cleanup: {
    transformers: {
      results: {
        helper: ({returned, tokens}) => {
          return _.flatten(_.map(_.zip(returned, tokens), ([r, t]) => {
            const parsed = JSON.parse(r.body)
            return _.map(parsed, (item) => {
              return _.merge({
                from: t.recipient,
              }, item)
            })
          }))
        },
        params: {
          returned: { ref: 'requestNewItems.results.items' },
          tokens: { ref: 'signTokens.results.tokens' }
        }
      }
    }
  }
}
