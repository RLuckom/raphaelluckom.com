const _ = require('lodash')

const { slackMethods } = require('./utils')

module.exports = {
  stages: {
    intro: {
      index: 0,
      dependencies: {
        parameterStore: {
          action: 'explorandaDeprecated',
          params: {
            dependencyName: {value: 'credentials'},
            accessSchema: {value: 'dataSources.AWS.parameterstore.getParameter'},
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
          action: 'explorandaDeprecated',
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
          action: 'explorandaDeprecated',
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
          action: 'explorandaDeprecated',
          params: {
            dependencyName: {value: 'exampleImage'},
            accessSchema: {value: 'dataSources.AWS.s3.getObject'},
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
          action: 'explorandaDeprecated',
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
    }
  },
  cleanup: {
    transformers: {
      image: { ref: 'outro.results.postImageToSlack_live'}
    }
  }
}
