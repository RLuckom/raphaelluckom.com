const _ = require('lodash')
const { exploranda } = require('donut-days')

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
    index: 0,
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
              }}}},
              channel: {value: { value: 'app_testing' }},
              text: {value: { value: 'it\'s alive!' }},
            }
          }
        }
      },
      getImage: {
        action: 'exploranda',
        params: {
          dependencyName: {value: 'exampleImage'},
          accessSchema: {value: exploranda.dataSources.AWS.s3.getObject},
          params: {
            value: {
              Bucket: { value: {value: '${example_jpg.bucket}'}},
              Key: { value: {value: '${example_jpg.key}'}},
            }
          }
        }
      },
    }
  },
  outro: {
    index: 2,
    transformers: {
      channels: {ref: 'main.results.channels_channels' }
    },
    dependencies: {
      postImageToSlack: {
        action: 'exploranda',
        params: {
          dependencyName: {value: 'live'},
          accessSchema: { value: slackMethods.uploadBufferAsFile },
          params: {
            value: {
              apiConfig: {all: {value: {all: {
                token: { ref: 'main.vars.slackCredentials.token' },
              }}}},
              channels: {value: { value: 'C01D71TDE0Z' }},
              file: {all: {value: { ref: 'main.results.getImage_exampleImage[0].Body'}}},
            }
          }
        }
      },
    }
  },
  cleanup: {
    transformers: {
      image: { ref: 'outro.results.postImageToSlack_live'}
    }
  }
}
