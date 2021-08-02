const _ = require('lodash')

const MAX_LOOKBACK = ${max_lookback_seconds}

module.exports = {
  stages: {
    getFeedItems: {
      index: 0,
      transformers: {},
      dependencies: {
        feedItems: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.query' },
            params: {
              explorandaParams: {
                apiConfig: {value: {region: '${table_region}'}},
                TableName: '${table_name}',
                ExpressionAttributeValues: {
                  all: {
                    ':lastChecked': {
                      helper: ({lookbackSeconds}) => {
                        console.log(lookbackSeconds)
                        lookbackSeconds = lookbackSeconds < MAX_LOOKBACK ? lookbackSeconds : MAX_LOOKBACK
                        return new Date().getTime() - (lookbackSeconds * 1000)
                      },
                      params: {
                        lookbackSeconds: {ref: 'event.queryStringParameters.lookBack' }
                      },
                    },
                    ':itemKind': {ref: '${feed_item_kind}'}
                  }
                },
                KeyConditionExpression: '${partition_key} = :itemKind',
                FilterExpression: '${modified_time_key} > :lastChecked',
              }
            },
          }
        },
      }
    }
  },
  cleanup: {
    transformers: {
      body: {
        helper: ({feedItems}) => JSON.stringify(feedItems) 
        params: {
          feedItems: { ref: 'getFeedItems.results.feedItems'},
        },
        statusCode: { value: 200 }
      }
    }
  }
}
