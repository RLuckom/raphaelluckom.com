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
                        frontMatter: {ref: 'item.results.parsed.frontMatter'},
                      }
                    },
                    func: ({description, frontMatter}) => {
                      const item = {...description}
                      item.metadata = frontMatter
                      delete item.typeDef
                      return item
                    }
                  }
                },
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
            meta: { ref: 'meta.results.trails' },
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
