const _ = require('lodash')
const { formatters, parsePost } = require('./helpers.js')

module.exports = {
  stages: {
    siteDescription: {
      index: 0,
      transformers: {
        key: {
          or: [
            {ref: 'event.Records[0].s3.object.key'},
            {ref: 'event.item.id.key'}
          ]
        },
      },
      dependencies: {
        siteDescription: {
          action: 'exploranda',
          formatter: formatters.singleValue.unwrapHttpResponse,
          params: {
            accessSchema: {
              value: {
                dataSource: 'GENERIC_API',
                host: '${domain_name}',
                path: '${site_description_path}',
              }
            },
          },
        }
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
          action: 'exploranda',
          formatter: ({parsed}) => parsed[0] === 404 ? null : parsePost(parsed[0].body),
            params: {
            accessSchema: {
              all: {
                dataSource: { value: 'GENERIC_API' },
                url: {ref: 'stage.metadata.uri'},
                onError: (err, res) => {
                  if (err && res.statusCode === 404) {
                    return {res: 404}
                  }
                  return {err, res}
                }
              }
            }
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
                item: {ref: 'item.vars.metadata'},
                trailNames: { ref: 'stage.trailNames'}
              }
            }
          }
        }
      }
    },
    postItemToWebsiteBucket: {
      condition: { ref: 'item.results.parsed' },
      index: 5,
      transformers: {
        fileContent: {
          helper: 'renderMarkdown',
          params: {
            template: {ref: 'renderDependencies.results.template' },
            doc: { ref: 'item.results.parsed' },
            metaDependencies: { ref: 'meta.results.trails' },
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
                Body: {ref: 'stage.fileContent' },
                Bucket: '${website_bucket}',
                ContentType: 'text/html; charset=utf-8',
                Key: { ref: 'item.vars.metadata.formatUrls.html.path' },
              }
            }
          },
        }
      },
    },
  },
}
