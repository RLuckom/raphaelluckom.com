const _ = require('lodash')
const { signTokenAccessSchema, parseJwkAccessSchema } = require('./helpers/signRequests')

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
                    {timestamp, origin, requestType: "${connection_request_type}", recipient: domain}
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
        items: {
          action: 'genericApi',
          params: {
            mergeIndividual: _.identity,
            apiConfig: {
              helper: ({tokens, domain}) => {
                const ret = _.map(tokens, ({timestamp, origin, recipient, sig}) => {
                  return {
                    url: "https://" + domain + "/${connection_request_api_path}",
                    token: Buffer.from(JSON.stringify({sig, timestamp, origin, requestType: "${connection_request_type}", recipient})).toString('base64')
                  }
                })
                return ret
              },
              params: {
                domain: { ref: 'event.domain' },
                tokens: { ref: 'signToken.results.tokens' }
              }
            }
          }
        },
      }
    },
  },
}
