module.exports = {
  intro: {
    dependencies: {
      nextFunction: {
        action: 'exploranda',
        params: {
          dependencyName: { value: 'respondToAction' },
          accessSchema: { value: 'dataSources.AWS.lambda.invoke'},
          params: {
            value: {
              apiConfig: {
                all: {
                  value: { 
                    all: {
                      region: process.env.AWS_REGION
                    }
                  }
                }
              },
              InvocationType: {value: { value: 'Event'}},
              FunctionName: {value: { value: '${test_function}' }},
              Payload: {
                all: {
                  value: {
                    helper: 'toJson',
                    params: {
                      runId: { ref: 'stage.runId' },
                      config: { 
                        value: {
                          intro: {},
                          main: {},
                          outro: {},
                        }
                      }
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
      runId: {
        helper: "uuid",
      }
    }
  },
  main: {},
  outro: {},
}
