module.exports = {
  stages: {
    intro: {
      index: 0,
      transformers: {
        body: { 
          helper: 'fromJson',
          params: {
            string: { ref: 'event.body'}
          }
        },
      },
      dependencies: {
        parameterStore: {
          action: 'explorandaDeprecated',
          params: {
            dependencyName: {value: 'credentials'},
            accessSchema: {value: getParameter},
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
    main: {
      index: 1,
      transformers: {
        valid: {
          helper: 'verifySlackSignature',
          params: {
            messageBody: { ref: 'event.body'},
            credentials: {
              helper: 'fromJson',
              params: {
                string: { ref: 'intro.results.parameterStore_credentials[0].Value'},
              }
            },
            messageSig: { ref: 'event.headers.X-Slack-Signature' },
            timestampEpochSeconds: { ref: 'event.headers.X-Slack-Request-Timestamp' },
          }
        }
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
