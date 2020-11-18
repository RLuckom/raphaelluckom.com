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

const deleteItem = {
  dataSource: 'AWS',
  namespaceDetails: {
    name: 'DynamoDB',
    constructorArgs: {}
  },
  name: 'Delete',
  requiredParams: {
    TableName: {},
    Key: {
      formatter: (i) => _.reduce(i, (a, v, k) => {
        if (_.isString(v)) {
          a[k] = {'S': v}
        } else if (_.isNumber(v)) {
          a[k] = {'N': v}
        } else if (v === true || v === false) {
          a[k] = {'BOOL': v}
        } else if (_.isArray(v)) {
          a[k] = _.map(v, converter.marshall)
        } else {
          a[k] = converter.marshall(v)
        }
        return a
      }, {})
    }
  },
  apiMethod: 'deleteItem',
};

module.exports = {
  stages: {
    getAndUpdateDependencies: {
      index: 0,
      transformers: {
        item: { ref: 'event.item' },
        dependsOn: {
          helper: 'transform',
          params: {
            arg: { ref: 'event.dependsOn' },
            func: {
              value: (dependsOn) => {
                if (_.isString(dependsOn)) {
                  try {
                    return JSON.parse(dependsOn)
                  } catch(e) {}
                  return dependsOn
                }
                return dependsOn
              }
            }
          }
        },
      },
      dependencies: {
        get: {
          action: 'exploranda',
          params: {
            accessSchema: {value: query},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: 'us-east-1'}},
                TableName: '${table}',
                IndexName: '${reverseDependencyIndex}',
                ExpressionAttributeValues: {
                  all: {
                    ':item': {ref: 'stage.item'}
                  }
                },
                KeyConditionExpression: 'dependent = :item'
              }
            },
          }
        },
        update: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.putItem'},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: 'us-east-1'}},
                TableName: '${table}',
                Item: {
                  helper: 'transform',
                  params: {
                    arg: {all: { item: {ref: 'stage.item'}, dependsOn: {ref: 'stage.dependsOn'}}},
                    func: {
                      value: ({item, dependsOn}) => _.isArray(dependsOn) ? _.map(dependsOn, (depended) => {
                        return {
                          dependent: item,
                          depended
                        }
                      }) : { dependent: item, depended: JSON.stringify(dependsOn) }
                    }
                  }
                }
              }
            },
          }
        },
      },
    },
    deleteOldDependencies: {
      index: 1,
      transformers: {
        recordsToDelete: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                dependsOn: {ref: 'getAndUpdateDependencies.vars.dependsOn' },
                existingRecords: { ref: 'getAndUpdateDependencies.results.get' }
              }
            },
            func: {
              value: ({dependsOn, existingRecords}) => {
                const keys = _.filter(existingRecords, (itm) => {
                  if (_.isString(dependsOn)) {
                    return itm.depended !== dependsOn
                  }
                  return dependsOn.indexOf(itm.depended) === -1
                })
                return keys
              }
            }
          }
        }
      },
      dependencies: {
        delete: {
          condition: { ref: 'stage.recordsToDelete.length' },
          action: 'exploranda',
          params: {
            accessSchema: {value: deleteItem},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: 'us-east-1'}},
                TableName: '${table}',
                Key: {ref : 'stage.recordsToDelete'}
              },
            }
          },
        },
      },
    },
  }
}
