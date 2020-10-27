const { slackMethods } = require('./utils')

module.exports = {
  stages: {
    getSlackCredentials: {
      index: 0,
      dependencies: {
        parameterStore: {
          action: 'exploranda',
          params: {
            dependencyName: {value: 'credentials'},
            accessSchema: {value: 'dataSources.AWS.parameterstore.getParameter'},
            params: {
              explorandaParams: {
                Name: "${slack_credentials_parameterstore_key}" ,
                WithDecryption: true ,
              }
            }
          },
        }
      },
    },
    verifySlackSignature: {
      index: 1,
      transformers: {
        valid: {
          helper: 'verifySlackSignature',
          params: {
            messageBody: { ref: 'event.body'},
            credentials: {
              helper: 'fromJson',
              params: {
                string: { ref: 'getSlackCredentials.results.parameterStore_credentials[0].Value'},
              }
            },
            messageSig: { ref: 'event.headers.X-Slack-Signature' },
            timestampEpochSeconds: { ref: 'event.headers.X-Slack-Request-Timestamp' },
          }
        },
        credentials: {
          helper: 'fromJson',
          params: {
            string: { ref: 'getSlackCredentials.results.parameterStore_credentials[0].Value'},
          }
        },
      },
    },
    postRebuttal: {
      index: 2,
      condition: { ref: 'verifySlackSignature.vars.valid.result' },
      transformers: {
        messageBody: { 
          helper: 'fromJson',
          params: {
            string: { ref: 'event.body'}
          }
        },
      },
      dependencies: { 
        post: {
          action: 'exploranda',
          params: {
            accessSchema: { value: slackMethods.postMessage },
            params: {
              explorandaParams: {
                apiConfig: {all: {token: { ref: 'verifySlackSignature.vars.credentials.token' }}},
                channel: { ref: 'stage.messageBody.event.channel'},
                text: 'I know you are but what am I',
              }
            }
          },
        },
      },
    },
  },
  cleanup: {
    transformers: {
      statusCode: { value: 200 },
      body: {helper: 'toJson', params: {challenge: { ref: 'intro.vars.body.challenge' }}},
    }
  }
}
