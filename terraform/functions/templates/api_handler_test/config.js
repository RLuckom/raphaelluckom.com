module.exports = {
  stages: {
    intro: {
      index: 0,
      dependencies: {
        nextFunction: {
          conditions: {
            hasAction: {ref: 'stage.messageBody.action'},
          },
          action: 'explorandaDeprecated',
          params: {
            dependencyName: { value: 'respondToAction' },
            accessSchema: { value: 'dataSources.AWS.apigatewaymanagementapi.postToConnection'},
            params: {
              value: {
                apiConfig: {
                  all: {
                    value: { 
                      all: {
                        endpoint: {value: '${apigateway_management_endpoint}'}
                      }
                    }
                  }
                },
                ConnectionId: {all: {
                  value: { ref: 'event.requestContext.connectionId' }
                }},
                Data: {
                  all: {
                    value: {
                      helper: 'toJson',
                      params: {
                        imgUrl: { value: 'https://www.media.raphaelluckom.com/img/9c530653-4f61-4e33-b956-b83bd05cb01d-1000.JPG'},
                        greeting: { value: "hello"},
                      }
                    }
                  }
                }
              }
            }
          }
        },
      },
      transformers: {
        messageBody: {
          helper: "fromJson",
          params: {
            string: {ref: 'event.body'}
          }
        }
      }
    },
  },
}
