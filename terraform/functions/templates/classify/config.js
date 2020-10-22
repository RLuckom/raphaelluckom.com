const _ = require('lodash')
const { exploranda } = require('donut-days')

const nlpDataSource = 'NLP'

const classifyUsingJsonModel = {
  name: 'ClassifyFromJsonModel',
  dataSource: nlpDataSource,
  namespaceDetails: {
    name: 'natural.BayesClassifier.restore',
    initialize: true,
  },
  isSync: true,
  apiMethod: {
    name: 'classify'
  },
  argumentOrder: ['doc'],
  requiredParams: {
    apiConfig: {},
    doc: {},
  }
};

const buildClassifierModel = {
  name: 'BuildClassifierModel',
  dataSource: nlpDataSource,
  namespaceDetails: {
    isTarget: true,
    initialize: { 
      useNew: true,
      argumentOrder: [],
    },
    name: 'natural.BayesClassifier',
  },
  isSync: true,
  apiMethod: {
    name: 'addDocument',
  },
  argumentOrder: ['doc', 'class'],
  requiredParams: {
    doc: {},
    class: {},
  },
  value: {
    path: (classifier) => {
      classifier.train()
      return JSON.stringify(classifier)
    }
  }
};

module.exports = {
  intro: {
    dependencies: {
      scan: {
        conditions: {
          shouldAddRecord: { ref: 'stage.shouldAddRecord' }
        },
        action: 'exploranda',
        params: {
          accessSchema: {value: 'dataSources.AWS.dynamodb.putItem'},
          params: {
            value: {
              TableName: { value: { value: "${classification_table_name}" }},
              Item: { all: { value: {all: {
                class: { ref: 'event.addItem.class' },
                document: { ref: 'event.addItem.document' },
                timeAdded: {
                  helper: 'msTimestamp'
                }
              }}}}, 
            }
          }
        },
      },
      getModel: {
        action: 'exploranda',
        params: {
          accessSchema: {value: 'dataSources.AWS.s3.getObject'},
          params: {
            value: {
              Bucket: { value: { value: "${classification_model.bucket}" }},
              Key: { value: { value: "${classification_model.key}" }},
            }
          }
        },
      },
    },
  },
  main: {
    transformers: {
      model: {
        helper: 'fromJson',
        params: {
          string: {
            helper: 'bufferToString',
            params: {
              buffer: { ref: 'intro.results.getModel[0].Body' }
            }
          }
        }
      }
    },
    dependencies: {
      classify: {
        action: 'exploranda',
        params: {
          accessSchema: { value: classifyUsingJsonModel },
          params: {
            value: {
              apiConfig: {all: {value: {ref: 'stage.model'}}},
              doc: { value: { value: 'show me images' }},
            }
          }
        }
      },
      scan: {
        action: 'exploranda',
        params: {
          accessSchema: {value: 'dataSources.AWS.dynamodb.scan'},
          params: {
            value: {
              TableName: { value: { value: "${classification_table_name}" }},
            }
          }
        },
      }
    },
  },
  outro: {
    dependencies: {
      buildModel: {
        action: 'exploranda',
        params: {
          accessSchema: { value: buildClassifierModel },
          params: {
            value: {
              class: {
                all: {
                  value: {
                    helper: 'map',
                    params: {
                      list: {ref: 'main.results.scan'},
                      handler: { value: 'class' }
                    }
                  }
                }
              },
              doc: {
                all: {
                  value: {
                    helper: 'map',
                    params: {
                      list: {ref: 'main.results.scan'},
                      handler: { value: 'document' }
                    }
                  }
                }
              },
            }
          }
        }
      },
    }
  },
  cleanup: {
    transformers: {
      scan: { ref: 'main.results.scan'},
      built: { ref: 'outro.results.buildModel'},
      class: { ref: 'main.results.classify'},
    }
  }
}
