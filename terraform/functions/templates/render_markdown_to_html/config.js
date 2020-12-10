const _ = require('lodash')
const { formatters, parsePost, siteDescriptionDependency } = require('./helpers.js')

module.exports = {
  stages: {
    siteDescription: {
      index: 0,
      transformers: {
        key: {
          or: [
            {ref: 'event.Records[0].s3.object.key'},
            {ref: 'event.item.memberUri'},
            {ref: 'event.item.uri'},
          ]
        },
      },
      dependencies: {
        siteDescription: siteDescriptionDependency('${domain_name}', '${site_description_path}')
      },
    },
    item: {
      index: 1,
      transformers: {
        metadata: {
          helper: 'identifyItem',
          params: {
            siteDescription: {ref: 'siteDescription.results.siteDescription'}, 
            resourcePath: {ref: 'siteDescription.vars.key'},
          },
        },
      },
      dependencies: {
        parsed: {
          formatter: ({parsed}) => {
            return parsed[0] === 404 ? null : parsePost(parsed[0].body)
          },
          action: 'genericApi',
          params: {
            url: {ref: 'stage.metadata.uri'},
            allow404: { value: true },
          }
        }
      },
    },
    renderDependencies: {
      condition: { ref: 'item.results.parsed' },
      index: 3,
      dependencies: {
        template: {
          action: 'genericApi',
          formatter: formatters.singleValue.unwrapHttpResponse,
          params: {
            uri: {
              helper: 'expandUrlTemplate',
              params: {
                templateString: { ref: 'item.vars.metadata.typeDef.formats.html.render.template' },
                templateParams: {ref: 'siteDescription.results.siteDescription.siteDetails'}, 
              },
            }
          },
        },
      },
    },
    meta: {
      condition: { ref: 'item.results.parsed' },
      index: 4,
      transformers: {
        trailNames: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                specific: {ref: 'item.results.parsed.frontMatter.meta.trail'},
                general: { ref: 'item.vars.metadata.typeDef.meta.trail.default' },
              },
            },
            func: {value: ({specific, general}) => (specific && general) ? _.concat(specific, general) : specific || general || []}
          }
        },
      },
      dependencies: {
        trails: {
          action: 'DD',
          formatter: formatters.singleValue.unwrapFunctionPayload,
          params: {
            FunctionName: {value: '${dependency_update_function}'},
            InvocationType: { value: 'RequestResponse' },
            event: { 
              all: {
                item: {
                  helper: 'transform',
                  params: {
                    arg: {
                      all: {
                        description: {ref: 'item.vars.metadata'},
                        parsed: {ref: 'item.results.parsed'},
                      }
                    },
                    func: ({description, parsed}) => {
                      const item = {...description}
                      item.metadata = parsed
                      delete item.typeDef
                      return item
                    }
                  }
                },
                trailNames: { ref: 'stage.trailNames'}
              }
            }
          }
        },
      }
    },
    accumulators: {
      condition: { ref: 'item.results.parsed' },
      index: 5,
      transformers: {
        accumulatorUrls: {
          helper: 'accumulatorUrls',
          params: {
            siteDetails: {ref: 'siteDescription.results.siteDescription.siteDetails'}, 
            item: {ref: 'item.vars.metadata'},
          }
        }
      },
      dependencies: {
        accumulators: {
          action: 'genericApi',
          condition: { ref: 'stage.accumulatorUrls.urls.length' },
          formatter: {
            helper: 'objectBuilder',
            params: {
              preformatter: formatters.singleValue.unwrapJsonHttpResponseArray,
              keys: { ref: 'stage.accumulatorUrls.types' },
              default: { value: null },
            }
          },
          params: {
            allow404: true,
            mergeIndividual: _.identity,
            url: { ref: 'stage.accumulatorUrls.urls' }
          }
        },
      }
    },
    postFormats: {
      condition: { ref: 'item.results.parsed' },
      index: 6,
      transformers: {
        renderedFormats: {
          helper: 'render',
          params: {
            dependencies: {
              all: {
                template: {ref: 'renderDependencies.results.template' },
                doc: { ref: 'item.results.parsed' },
                trails: { ref: 'meta.results.trails' },
                accumulators: { ref: 'accumulators.results.accumulators' },
              },
            },
            item: {ref: 'item.vars.metadata'},
            siteDetails: {ref: 'siteDescription.results.siteDescription.siteDetails'}, 
          },
        },
      },
      dependencies: {
        uploadHtml: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.putObject'},
            params: {
              explorandaParams: {
                Body: {ref: 'stage.renderedFormats.content' },
                Bucket: '${website_bucket}',
                ContentType: { ref: 'stage.renderedFormats.ContentType' },
                Key: { ref: 'stage.renderedFormats.path' },
              }
            }
          },
        }
      },
    },
  },
}
