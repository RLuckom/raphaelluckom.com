const _ = require('lodash')
const { exploranda } = require('donut-days')

const converter = require('aws-sdk').DynamoDB.Converter;
const scan = {
  dataSource: 'AWS',
  namespaceDetails: {
    name: 'DynamoDB',
    constructorArgs: {}
  },
  name: 'Scan',
  value: {
    path: ({Items}) => _.map(Items, (i) => converter.unmarshall(i))
  },
  incompleteIndicator: 'LastEvaluatedKey',
  nextBatchParamConstructor: (params, {LastEvaluatedKey}) => {
    return _.merge({}, params, {ExclusiveStartKey: LastEvaluatedKey});
  },
  requiredParams: {
    TableName: {},
  },
  optionalParams: {
    AttributesToGet: {},
    ConsistentRead: {},
    FilterExpression: {},
    ProjectionExpression: {},
    Select: {},
    Segment: {},
    TotalSegments: {},
  },
  apiMethod: 'scan',
};

const nlpDataSource = 'NLP'

const classifyUsingJsonModel = {
  name: 'ClassifyFromJsonModel',
  dataSource: nlpDataSource,
  initializeNamespace: true,
  namespaceDetails: {
    name: 'natural.BayesClassifier.restore'
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

module.exports = {
  intro: {
    dependencies: {
      scan: {
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
          accessSchema: {value: scan},
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
  },
  cleanup: {
    transformers: {
      image: { ref: 'main.results.scan'},
      class: { ref: 'main.results.classify'},
    }
  }
}
