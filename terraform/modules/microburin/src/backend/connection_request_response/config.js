const _ = require('lodash')

module.exports = {
  stages: {
    getConnections: {
      index: 0,
      transformers: {
        authorization: { ref: 'event.cf.request.headers.authorization[0]' }
      },
      dependencies: {
        connections: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.query'},
            explorandaParams: {
              apiConfig: {value: {region: '${connection_table_region}'}},
              TableName: {value: "${connection_table_name}"},
              ExpressionAttributeValues: {
                value: {
                  ':expectedStatus': '${connection_status_code_pending}',
                }
              },
              KeyConditionExpression: {value: '${connection_table_state_key} = :expectedStatus' },
            },
          },
        },
      }
    },
  },
  cleanup: {
    transformers: {
      statusCode: { value: 200 }
      // results: { ref: 'requestNewItems.results.items' }
    }
  }
}
