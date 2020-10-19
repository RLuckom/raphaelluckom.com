const _ = require('lodash')

const { slackMethods } = require('./utils')

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
    transformers: {
      slackCredentials: {
        helper: 'fromJson',
        params: {
          string: {ref: 'intro.results.parameterStore_credentials[0].Value'}
        }
      }
    },
    dependencies: {
      channels: {
        action: 'exploranda',
        params: {
          dependencyName: {value: 'channels'},
          accessSchema: { value: slackMethods.getChannels },
          params: {
            value: {
              apiConfig: {all: {value: {all: {token: { ref: 'stage.slackCredentials.token' }}}}},
            }
          }
        }
      },
      post: {
        action: 'exploranda',
        params: {
          dependencyName: {value: 'live'},
          accessSchema: { value: slackMethods.postMessage },
          params: {
            value: {
              apiConfig: {all: {value: {all: {
                token: { ref: 'stage.slackCredentials.token' },
                headerParamKeys: { value: ['content-type'] },
              }}}},
              channel: {value: { value: 'app_testing' }},
              text: {value: { value: 'it\'s alive!' }},
              'content-type': {value: { value: 'application/json' }},
            }
          }
        }
      },
    }
  },
  outro: {
    transformers: {
      channels: {ref: 'main.results' }
    }
  },
}
