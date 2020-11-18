const _ = require('lodash')

module.exports = {
  stages: {
    identifyChange: {
      index: 0,
      transformers: {
        bucket: {
          or: [
            {ref: 'event.Records[0].s3.bucket.name'},
            {ref: 'event.item.bucket'}
          ]
        },
        key: {
          or: [
            {ref: 'event.Records[0].s3.object.key'},
            {ref: 'event.item.key'}
          ]
        },
      }
    },
    getDependents: {
      index: 1,
      transformers: {
        template: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                bucket: { ref: 'identifyChange.vars.bucket' },
                key: { ref: 'identifyChange.vars.key' }
              }
            },
            func: {
              value:  ({bucket, key}) => {
                if (bucket === '${website_bucket}') {
                  return {
                    type: 'URI',
                    id: '${site_prefix}' + key
                  }
                }
                return {
                  type: 'S3_OBJECT',
                  id: {bucket, key}
                }
              }
            }
          },
        },
      },
      dependencies: {
        dependents: {
          action: 'DD',
          params: {
            FunctionName: {value: '${get_dependents_function}'},
            InvocationType: { value: 'RequestResponse' },
            event: { 
              all: {
                item: {
                  helper: 'transform',
                  params: {
                    arg: { ref: 'stage.template' },
                    func: { value: (x) => JSON.stringify(x) }
                  }
                }
              }
            }
          }
        }
      }
    },
    triggerRerender: {
      index: 1,
      transformers: {
        items: {
          helper: 'transform',
          params: {
            arg: { ref: 'getDependents.results.dependents[0]' },
            func: {
              value: (deps) => {
                console.log(deps)
                return _.map(JSON.parse(deps.Payload).dependents, (d) => JSON.parse(d.dependent))
              }
            }
          }
        }
      },
      dependencies: {
        rerender: {
          action: 'invokeFunction',
          params: {
            FunctionName: {value: '${render_function}'},
            Payload: { 
              helper: 'transform',
              params: {
                arg: { ref: 'stage.items' },
                func: { 
                  value: (items) => _.map(items, (item) => {
                    return JSON.stringify({ item })
                  })
                }
              }
            }
          }
        }
      }
    },
  }
}
