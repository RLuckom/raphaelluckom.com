const _ = require('lodash')
const { exploranda } = require('donut-days')

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
  isSync: true,
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
      restoreClassifier: {
        action: 'exploranda',
        params: {
          accessSchema: { value: restoreClassifier },
          params: {
            value: {
              jsonModel: {all: {value: {ref: 'stage.model'}}},
            }
          }
        }
      },
      classify: {
        action: 'exploranda',
        params: {
          accessSchema: { value: classify },
          params: {
            value: {
              apiConfig: {
                value: {
                  source: 'restoreClassifier',
                  formatter: ({restoreClassifier}) => restoreClassifier[0]
                }
              },
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
          }
        }
      },
      addDocuments: {
        action: 'exploranda',
        params: {
          accessSchema: { value: addDocuments },
          params: {
            value: {
              apiConfig: {
                value: {
                  source: 'buildModel',
                  formatter: ({buildModel}) => buildModel[0],
                }
              },
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
                      handler: { value: 'document' },
                    }
                  }
                }
              },
            }
          }
        }
      },
      train: {
        action: 'exploranda',
        params: {
          accessSchema: { value: train },
          params: {
            value: {
              apiConfig: {
                value: {
                  source: [ 'buildModel', 'addDocuments' ],
                  formatter: ({buildModel}) => buildModel[0],
                }
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
