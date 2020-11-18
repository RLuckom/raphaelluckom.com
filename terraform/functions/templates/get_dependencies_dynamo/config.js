const _ = require('lodash')
const converter = require('aws-sdk').DynamoDB.Converter;

const query = {
  dataSource: 'AWS',
  namespaceDetails: {
    name: 'DynamoDB',
    constructorArgs: {}
  },
  name: 'Query',
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
    ConditionalOperator: {},
    ConsistentRead: {},
    ExclusiveStartKey: {},
    ExpressionAttributeNames: {},
    ExpressionAttributeValues: {
      formatter: (i) => _.reduce(i, (a, v, k) => {
        if (_.isString(v)) {
          a[k] = {'S': v}
        } else if (_.isNumber(v)) {
          a[k] = {'N': v}
        } else if (v === true || v === false) {
          a[k] = {'BOOL': v}
        } else {
          a[k] = converter.marshall(v)
        }
        return a
      }, {})
    },
    FilterExpression: {},
    IndexName: {},
    KeyConditionExpression: {},
    KeyConditions: {},
    Limit: {},
    ProjectionExpression: {},
    QueryFilter: {},
    ReturnConsumedCapacity: {},
    ScanIndexForward: {},
    Select: {},
  },
  apiMethod: 'query',
};

module.exports = {
  stages: {
    getDependents: {
      index: 0,
      transformers: {
        item: { ref: 'event.item' },
      },
      dependencies: {
        dependents: {
          action: 'exploranda',
          params: {
            accessSchema: {value: query },
            params: {
              explorandaParams: {
                apiConfig: {value: {region: 'us-east-1'}},
                TableName: '${table}',
                ExpressionAttributeValues: {
                  all: {
                    ':item': {ref: 'stage.item'}
                  }
                },
                KeyConditionExpression: 'depended = :item'
              }
            },
          }
        },
      },
    },
  },
  cleanup: {
    transformers: {
      dependents: { ref: 'getDependents.results.dependents'}
    }
  }
}
