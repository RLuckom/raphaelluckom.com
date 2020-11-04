const { slackMethods } = require('./utils')
const uuid = require('uuid')

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
    input: {
      index: 2,
      condition: { ref: 'verifySlackSignature.vars.valid.result' },
      transformers: {
        messageBody: { 
          helper: 'fromJson',
          params: {
            string: { ref: 'event.body'}
          }
        },
        noSelfMentions: {
          helper: 'transform',
          params: {
            arg: {
              helper: 'fromJson',
              params: {
                string: { ref: 'event.body'}
              }
            },
            func: {value: (body) => body.event.text.replace(/<[^>]*>/g, '') }
          },
        },
        firstWord: {
          helper: 'transform',
          params: {
            arg: {
              helper: 'fromJson',
              params: {
                string: { ref: 'event.body'}
              }
            },
            func: {value: (body) => body.event.text.replace(/<[^>]*>/g, '').split(/\s/).filter((s) => s.length)[0] }
          },
        },
      },
    },
    updatePostsDb: {
      index: 3,
      condition: {
        helper: "matches",
        params: {
          a: { ref: 'input.vars.firstWord' },
          b: { value: 'post' },
        }
      },
      transformers: {
        mediaItem: {
          helper: 'transform',
          params: {
            arg: { ref: 'input.vars.noSelfMentions' },
            func: {
              value: (arg) => {
                const itemString = arg.match(/```([^`]*)```/)[1]
                let item = null
                try {
                  item = JSON.parse(itemString)
                  item.timeAddedMs = item.timeAddedMs || new Date().getTime()
                  item.id = item.id || uuid.v4()
                } catch(e) {
                }
                return item || itemString
              }
            }
          }
        }
      },
      dependencies: { 
        post: {
          action: 'exploranda',
          params: {
            accessSchema: { value: 'dataSources.AWS.dynamodb.putItem' },
            params: {
              explorandaParams: {
                TableName: "${posts_table_name}",
                Item: { ref: 'stage.mediaItem'},
              }
            }
          },
        },
        writePostToSlack: {
          action: 'exploranda',
          params: {
            accessSchema: { value: slackMethods.postMessage },
            params: {
              explorandaParams: {
                apiConfig: {all: {token: { ref: 'verifySlackSignature.vars.credentials.token' }}},
                channel: { ref: 'input.vars.messageBody.event.channel'},
                text: { 
                  helper: 'transform',
                  params: {
                    arg: { ref: 'stage.mediaItem' },
                    func: { value: (arg) => '```' + JSON.stringify(arg) + '```' }
                  },
                }
              }
            }
          },
        },
      },
    }
  },
  cleanup: {
    transformers: {
      statusCode: { value: 200 },
    }
  }
}
