const _ = require('lodash')

const nlpDataSource = 'NLP'

const classify = {
  name: 'Classify',
  dataSource: nlpDataSource,
  namespaceDetails: {
    paramDriven: true
  },
  apiMethod: {
    argumentOrder: ['doc'],
    isSync: true,
    name: 'classify'
  },
  requiredParams: {
    apiConfig: {},
    doc: {},
  }
};

const restoreClassifier = {
  name: 'restoreClassifier',
  dataSource: nlpDataSource,
  namespaceDetails: {
    name: 'natural.BayesClassifier.restore',
    initialize: {
      isSync: true,
      argumentOrder: ['jsonModel'],
    },
  },
};

const buildClassifierModel = {
  name: 'BuildClassifierModel',
  dataSource: nlpDataSource,
  namespaceDetails: {
    isTarget: true,
    initialize: { 
      isSync: true,
      useNew: true,
      argumentOrder: [],
    },
    name: 'natural.BayesClassifier',
  },
};

const addDocuments = {
  name: 'addDocuments',
  dataSource: nlpDataSource,
  namespaceDetails: {
    paramDriven: true
  },
  apiMethod: {
    argumentOrder: ['doc', 'class'],
    isSync: true,
    name: 'addDocument'
  },
  requiredParams: {
    apiConfig: {},
    doc: {},
    class: {},
  },
};

const train = {
  name: 'train',
  dataSource: nlpDataSource,
  namespaceDetails: {
    paramDriven: true
  },
  apiMethod: {
    argumentOrder: ['doc', 'class'],
    isSync: true,
    name: 'train'
  },
  requiredParams: {
    apiConfig: {},
  },
};

module.exports = {
  intro: {
    index: 0,
    dependencies: {
      scan: {
        conditions: {
          shouldAddRecord: { ref: 'stage.shouldAddRecord' }
        },
        action: 'explorandaUpdated',
        params: {
          accessSchema: {value: 'dataSources.AWS.dynamodb.putItem'},
          params: {
            explorandaParams: {
              TableName: "${classification_table_name}" ,
              Item: { all: {
                class: { ref: 'event.addItem.class' },
                document: { ref: 'event.addItem.document' },
                timeAdded: {
                  helper: 'msTimestamp'
                }
              }}, 
            }
          }
        },
      },
      getModel: {
        action: 'explorandaUpdated',
        params: {
          accessSchema: {value: 'dataSources.AWS.s3.getObject'},
          params: {
            explorandaParams: {
              Bucket: "${classification_model.bucket}" ,
              Key: "${classification_model.key}" ,
            }
          }
        },
      },
    },
  },
  main: {
    index: 1,
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
      restoreClassifier: {
        action: 'explorandaUpdated',
        params: {
          accessSchema: { value: restoreClassifier },
          params: {
            explorandaParams: {
              jsonModel: {ref: 'stage.model'},
            }
          }
        }
      },
      classify: {
        action: 'explorandaUpdated',
        params: {
          accessSchema: { value: classify },
          params: {
            explorandaParams: {
              apiConfig: {
                source: 'restoreClassifier',
                formatter: 'restoreClassifier'
              },
              doc: 'show me images',
            }
          }
        }
      },
      scan: {
        action: 'explorandaUpdated',
        params: {
          accessSchema: {value: 'dataSources.AWS.dynamodb.scan'},
          params: {
            explorandaParams: {
              TableName: "${classification_table_name}" ,
            }
          }
        },
      }
    },
  },
  outro: {
    index: 2,
    dependencies: {
      buildModel: {
        action: 'explorandaUpdated',
        params: {
          accessSchema: { value: buildClassifierModel },
        }
      },
      addDocuments: {
        action: 'explorandaUpdated',
        params: {
          accessSchema: { value: addDocuments },
          params: {
            explorandaParams: {
              apiConfig: {
                source: 'buildModel',
                formatter: 'buildModel',
              },
              class: {
                helper: 'map',
                params: {
                  list: {ref: 'main.results.scan'},
                  handler: { value: 'class' }
                }
              },
              doc: {
                helper: 'map',
                params: {
                  list: {ref: 'main.results.scan'},
                  handler: { value: 'document' },
                }
              }
            }
          }
        }
      },
      train: {
        action: 'explorandaUpdated',
        params: {
          accessSchema: { value: train },
          params: {
            explorandaParams: {
              apiConfig: {
                source: [ 'buildModel', 'addDocuments' ],
                formatter: 'buildModel',
              },
            }
          }
        }
      }
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
