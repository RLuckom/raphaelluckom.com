const _ = require('lodash')

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
            accessSchema: {value: 'dataSources.AWS.dynamodb.query'},
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
            accessSchema: {value: 'dataSources.AWS.dynamodb.deleteItem'},
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
