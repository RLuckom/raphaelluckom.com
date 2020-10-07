module.exports = {
  intro: {
    dependencies: {
      nextFunction: {
        action: 'eventConfiguredInvocation',
        params: {
          FunctionName: {value: '${test_function}'},
          config: {
            value: {
              intro: {},
              main: {},
              outro: {},
            }
          },
          payloadValues: {
            all: {
              runId: { ref: 'stage.uniqueId' }
            }
          },
          resourceReferences: {
            value: {
              s3Object: {
                all: {
                  fileName: {ref: 'prospectiveEvent.runId' }
                }
              }
            }
          },
        }
      },
    },
    transformers: {
      uniqueId: {
        helper: "uuid",
      }
    }
  },
  main: {},
  outro: {},
}
