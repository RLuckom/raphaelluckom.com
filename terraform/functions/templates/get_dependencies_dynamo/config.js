const _ = require('lodash')

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
            accessSchema: {value: 'dataSources.AWS.dynamodb.query' },
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
