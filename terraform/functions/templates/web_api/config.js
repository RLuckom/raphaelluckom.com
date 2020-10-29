const _ = require('lodash')
const converter = require('aws-sdk').DynamoDB.Converter;

const scan = {
  dataSource: 'AWS',
  namespaceDetails: {
    name: 'DynamoDB',
    constructorArgs: {}
  },
  name: 'Scan',
  value: {
    path: (value) => {
      return {...value, ...{Items: _.map(value.Items, (i) => converter.unmarshall(i))}}
    },
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
    ExclusiveStartKey: {},
    ProjectionExpression: {},
    Select: {},
    Segment: {},
    Limit: {},
    TotalSegments: {},
  },
  apiMethod: 'scan',
};

module.exports = {
  stages: {
    main: {
      index: 1,
      transformers: {
        body: {
          helper: 'fromJson',
          params: {
            string: { ref: 'event.body' }
          }
        }
      },
      dependencies: {
        scan: {
          action: 'exploranda',
          params: {
            accessSchema: {value: scan},
            params: {
              explorandaParams: {
                TableName: "${table_name}",
                Limit: { ref: 'stage.body.Limit' },
                ExclusiveStartKey: { ref: 'stage.body.startItem' },
              }
            }
          },
        }
      },
    },
  },
  cleanup: {
    transformers: {
      statusCode: { value: 200 },
      headers: {
        value: {
          "Content-Type": "application/json"
        }
      },
      isBase64Encoded: {value: false},
      body: {
        helper: 'transform',
        params: { 
          arg: {ref: 'main.results.scan[0]'},
          func: { value: (arg) => JSON.stringify(arg) }
        }
      }
    }
  }
}
