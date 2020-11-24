const _ = require('lodash')

module.exports = {
  stages: {
    associations: {
      index: 0,
      transformers: {
        keyType: {
          or: [
          { ref: 'event.keyType' },
          { ref: 'event.queryStringParameters.keyType' },
          ]
        },
        keyId: {
          or: [
          { ref: 'event.keyId' },
          { ref: 'event.queryStringParameters.keyId' },
          ]
        },
      },
      dependencies: {
        forwardAssociations: {
          condition: { 
            helper: 'matches',
            params: {
              a: {ref: 'stage.keyType'},
              b: {value: '${forward_key_type}' }
            }
          },
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.query' },
            params: {
              explorandaParams: {
                apiConfig: {value: {region: 'us-east-1'}},
                TableName: '${table}',
                ExpressionAttributeValues: {
                  all: {
                    ':resourceId': {ref: 'stage.keyId'}
                  }
                },
                KeyConditionExpression: '${forward_key_type} = :resourceId'
              }
            },
          }
        },
        reverseAssociations: {
          condition: { 
            helper: 'matches',
            params: {
              a: {ref: 'stage.keyType'},
              b: {value: '${reverse_key_type}' }
            }
          },
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.query' },
            params: {
              explorandaParams: {
                apiConfig: {value: {region: 'us-east-1'}},
                TableName: '${table}',
                IndexName: '${reverse_association_index}',
                ExpressionAttributeValues: {
                  all: {
                    ':resourceId': {ref: 'stage.keyId'}
                  }
                },
                KeyConditionExpression: '${reverse_key_type} = :resourceId'
              }
            },
          }
        },
      },
    },
  },
  cleanup: {
    transformers: {
      body: {
        helper: 'transform',
        params: {
          arg: {
            or: [
              { ref: 'associations.results.forwardAssociations'},
              { ref: 'associations.results.reverseAssociations'},
            ]
          },
          func: {value: (arg) => JSON.stringify(arg) }
        }
      },
      statusCode: { value: 200 }
    }
  }
}
