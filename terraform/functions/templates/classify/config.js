const _ = require('lodash')
const { exploranda } = require('donut-days')

const { slackMethods } = require('./utils')

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

module.exports = {
  intro: {
    dependencies: {
      scan: {
        action: 'exploranda',
        params: {
          dependencyName: {value: 'scan'},
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
      }
    },
  },
  main: {
    dependencies: {
      scan: {
        action: 'exploranda',
        params: {
          dependencyName: {value: 'scan'},
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
      image: { ref: 'main.results.scan_scan'}
    }
  }
}
