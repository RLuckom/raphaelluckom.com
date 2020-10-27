const getParameter = {
  dataSource: 'AWS',
  namespaceDetails: {
    name: 'SSM',
    constructorArgs: {}
  },
  name: 'getParameter',
  value: {
    path: 'Parameter'
  },
  requiredParams: {
    Name: {},
  },
  optionalParams: {
    WithDecryption: {},
  },
  apiMethod: 'getParameter',
};

module.exports = {
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
        action: 'exploranda',
        params: {
          dependencyName: {value: 'credentials'},
          accessSchema: {value: getParameter},
          params: {
            value: {
              Name: { value: { value: "${slack_credentials_parameterstore_key}" }},
              WithDecryption: { value: { value: true }},
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
  cleanup: {
    transformers: {
      statusCode: { value: 200 },
      body: {helper: 'toJson', params: {challenge: { ref: 'intro.vars.body.challenge' }}},
    }
  }
}
