module.exports = {
  stages: {
    dummy: {
      index: 0,
      dependencies: {
        dummy: {
          action: 'exploranda',
          params: {
            accessSchema: {
              value: {
                dataSource: 'SYNTHETIC',
                value: { path: (x) => x},
                transformation: ({meta}) => {
                  return meta
                }
              }
            },
            explorandaParams: {
              meta: {
                helper: () => {
                  return "foo"
                },
                params: {
                }
              }
            }
          }
        }
      }
    },
  },
  cleanup: {
    transformers: {
      body: { ref: 'dummy.results.dummy[0]' },
      statusCode: { value: 200 }
    }
  }
}
