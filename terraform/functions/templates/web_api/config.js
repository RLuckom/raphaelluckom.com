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
    ExpressionAttributeValues: {},
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
        query: {
          all: {
            Limit: { ref: 'event.queryStringParameters.Limit' },
            FilterExpression: { ref: 'event.queryStringParameters.FilterExpression' },
            ExclusiveStartKey: {
              helper: 'fromJson',
              params: {
                string: { or: [{ref: 'event.queryStringParameters.startItem'}, { value: 'null' } ]},
              }
            },
            ExpressionAttributeValues: {
              helper: 'fromJson',
              params: {
                string: { or: [{ref: 'event.queryStringParameters.ExpressionAttributeValues'}, { value: 'null' } ]},
              }
            },
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
                Limit: { ref: 'stage.query.Limit' },
                ExpressionAttributeValues: { ref: 'stage.query.ExpressionAttributeValues' },
                FilterExpression: { ref: 'stage.query.FilterExpression' },
                ExclusiveStartKey: { ref: 'stage.query.ExclusiveStartKey' },
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
        all: {
          "Content-Type": {value: "application/json"},
          "Access-Control-Allow-Headers" : {value: "Content-Type"},
          "Access-Control-Allow-Origin": {or: [{ref: 'event.headers.origin'}, {ref: 'event.headers.Origin'}, {value: ''}]},
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
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
