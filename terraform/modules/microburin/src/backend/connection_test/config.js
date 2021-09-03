const _ = require('lodash')
const { signTokenAccessSchema, parseJwkAccessSchema } = require('./helpers/signRequests')

const FAIL = "FAIL"

module.exports = {
  stages: {
    getSigningKey: {
      index: 0,
      dependencies: {
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
    signToken: {
      index: 1,
      dependencies: {
        tokens: {
          action: 'exploranda',
          params: {
            accessSchema: {value: signTokenAccessSchema },
            explorandaParams: {
              signingKeyObject: {ref: 'getSigningKey.results.signingKeyObject'},
              payload: {
                helper: ({timestamp, origin, domain}) => {
                  const ret = [
                    {timestamp, origin, recipient: domain}
                  ]
                  return ret
                },
                params: {
                  timestamp: { 
                    helper: () => { 
                      return new Date().getTime() 
                    }
                  },
                  origin: { value: "${social_domain}" },
                  domain: { ref: 'event.domain' }
                }
              }
            }
          },
        },
      }
    },
    sendRequest: {
      index: 2,
      dependencies: {
        canary: {
          action: 'exploranda',
          params: {
            accessSchema: {value: {
              name: 'GET url',
              dataSource: 'GENERIC_API',
              headerParamKeys: ['Microburin-Signature'],
            }},
            behaviors: {
              value: {
                onError: (err, res) => {
                  if (err) {
                    console.log(err)
                  }
                  return (!err && res) ? {res} : {res: FAIL}
                }
              }
            },
            explorandaParams: {
              apiConfig: {
                helper: ({tokens, domain}) => {
                  const ret = _.map(tokens, ({timestamp, origin, recipient, sig}) => {
                    return {
                      url: "https://" + domain + "/${connection_test_api_path}",
                    }
                  })
                  return ret
                },
                params: {
                  domain: { ref: 'event.domain' },
                  tokens: { ref: 'signToken.results.tokens' }
                }
              },
              'Microburin-Signature': {
                helper: ({token}) => {
                  return Buffer.from(JSON.stringify({sig: token.sig, timestamp: token.timestamp, origin: token.origin, recipient: token.recipient, bodySig: null})).toString('base64')
                },
                params: {
                  token: { ref: 'signToken.results.tokens[0]' }
                }
              },
            }
          }
        },
      }
    },
    updateState: {
      index: 3,
      dependencies: {
        updateState: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.putItem'},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: '${connections_table_region}'}},
                TableName: '${connections_table_name}',
                Item: { 
                  helper: ({domain, canary}) => {
                    canary = canary === FAIL
                    const ret = {
                      "${connection_type_key}" : "${connection_type_initial}",
                      "${domain_key}": domain,
                      "${connection_table_state_key}": canary ? "${connection_status_code_disconnected}" : "${connection_status_code_connected}",
                    }
                    if (canary) {
                      ret['${connection_table_ttl_attribute}'] = new Date().getTime() / 1000 + ${intermediate_state_timeout_secs}
                    }
                    return ret
                  },
                  params: {
                    domain: { ref: 'event.domain' },
                    canary: { ref: 'sendRequest.results.canary[0]' }
                  }
                }
              }
            }
          }
        },
      },
    },
  },
}
