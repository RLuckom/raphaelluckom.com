const fs = require('fs')
const _ = require('lodash')
const yaml = require('js-yaml')
const moment = require('moment')
const hljs = require('highlight.js');
const urlTemplate = require('url-template')

const mdr = require('markdown-it')({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }
    return ''; // use external default escaping
  }
}).use(require('markdown-it-footnote'))

//TODO: make this also accept toml, json front matter
function parsePost(s) {
  const t = s.split('\n')
  if (_.trim(t[0]) === '---') {
    let started = false
    let frontMatter = ''
    let content = ''
    for (r of t.slice(1)) {
      if (_.trim(r) === '---') {
        if (!started) {
          started = true
        }
      } else {
        if (started) {
          content += r + "\n"
        } else {
          frontMatter += r + '\n'
        }
      }
    }
    try {
      const fm = yaml.safeLoad(frontMatter)
      if (fm.date) {
        fm.date = moment(fm.date)
      }
      return { frontMatter: fm, content, raw:s }
    } catch(e) {
      console.log(e)
      return { raw: s} 
    }
  } else {
    return { raw: s }
  }
}

module.exports = {
  stages: {
    identifyItemToRender: {
      index: 0,
      transformers: {
        bucket: {
          or: [
            {ref: 'event.Records[0].s3.bucket.name'},
            {ref: 'event.item.id.bucket'}
          ]
        },
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
    getItemToRender: {
      index: 1,
      transformers: {
        itemType: {
          helper: 'transform',
          params: {
            arg: {ref: 'identifyItemToRender.vars.key'},
            func: { value: (key) => {
              const ar = key.split('.')
              ar.pop()
              return ar.pop()
            } }
          }
        },
        name: {
          helper: 'transform',
          params: {
            arg: {ref: 'identifyItemToRender.vars.key'},
            func: { value: (key) => {
              const ar = key.split('.')
              ar.pop()
              ar.pop()
              return ar.pop().split('/').pop()
            } }
          }
        },
        siteDescription: {ref: 'identifyItemToRender.results.siteDescription[0].body'}, 
      },
      dependencies: {
        text: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.getObject'},
            params: {
              explorandaParams: {
                Bucket: {ref: 'identifyItemToRender.vars.bucket' },
                Key: {ref: 'identifyItemToRender.vars.key'},
              }
            }
          },
        }
      },
    },
    parseItemStructure: {
      index: 2,
      transformers: {
        structuredItem: {
          helper: 'transform',
          params: {
            func: {
              value: (x) =>  parsePost(x.toString())
            },
            arg: {ref: 'getItemToRender.results.text[0].Body' }
          }
        },
      }
    },
    resolveRenderDependencies: {
      index: 3,
      transformers: {
        metaResources: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                frontMatter: {ref: 'parseItemStructure.vars.structuredItem.frontMatter'},
                siteDescription: {ref: 'getItemToRender.vars.siteDescription'},
              }
            },
            func: {
              value: ({frontMatter, siteDescription}) => {
                return _.reduce(frontMatter.meta, (a, v, k) => {
                  const idTemplate = _.get(siteDescription, ['relations', 'meta', k, 'idTemplate'])
                  if (idTemplate) {
                    const template = urlTemplate.parse(idTemplate)
                    a[k] = _.map(v, (name) => template.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(name)}}))
                  }
                  return a
                }, {})
              }
            }
          }
        },
        templateUri: {
          helper: 'transform',
          params: {
            arg: { ref: 'getItemToRender.vars' },
            func: {
              value: ({itemType, siteDescription}) => {
                const template = urlTemplate.parse(_.get(siteDescription, ['relations', itemType, 'formats', 'html', 'render', 'template']))
                return template.expand(siteDescription.siteDetails)
              }
            }
          }
        },
        selfUri: {
          helper: 'transform',
          params: {
            arg: { ref: 'getItemToRender.vars' },
            func: {
              value: ({itemType, siteDescription, name}) => {
                const template = urlTemplate.parse(_.get(siteDescription, ['relations', itemType, 'idTemplate']))
                return template.expand({...siteDescription.siteDetails, ...{name}})
              }
            }
          }
        }
      },
      dependencies: {
        template: {
          action: 'exploranda',
          params: {
            accessSchema: {
              helper: 'transform',
              params: {
                arg: { ref: 'stage.templateUri' },
                func: {
                  value: (uriString) => {
                    return {
                      dataSource: 'GENERIC_API',
                      uri: uriString
                    }
                  }
                }
              }
            },
            params: {},
          },
        },
      },
    },
    IndicateDependencies: {
      index: 4,
      transformers: {
        item: {
          all: {
            name: { ref: 'getItemToRender.vars.name' },
            tagNames: {
              helper: 'transform',
              params: {
                arg: {
                  all: {
                    specific: {ref: 'parseItemStructure.vars.structuredItem.frontMatter.meta.list'},
                    general: { helper: 'transform',
                      params: {
                        arg: {
                          all: {
                            itemType: { ref: 'getItemToRender.vars.itemType' },
                            siteDescription: {ref: 'identifyItemToRender.results.siteDescription[0].body'}, 
                          }
                        },
                        func: {value: ({itemType, siteDescription}) => _.get(siteDescription, ['relations', itemType, 'meta', 'list', 'default']) }
                      }
                    }
                  },
                },
                func: {value: ({specific, general}) => _.concat(specific, general) }
              }
            },
            itemType: { ref: 'getItemToRender.vars.itemType' },
            metadata: {ref: 'parseItemStructure.vars.structuredItem.frontMatter'},
            id: {ref: 'resolveRenderDependencies.vars.selfUri' }
          }
        },
      },
      dependencies: {
        updateItemDependencies: {
          action: 'DD',
          params: {
            FunctionName: {value: '${dependency_update_function}'},
            InvocationType: { value: 'RequestResponse' },
            event: { 
              all: {
                item: {
                  helper: 'transform',
                  params: {
                    arg: {ref: 'stage.item'},
                    func: { value: (x) => JSON.stringify(x)}
                  }
                },
              }
            }
          }
        }
      }
    },
    postItemToWebsiteBucket: {
      index: 5,
      transformers: {
        fileContent: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                template: {ref: 'resolveRenderDependencies.results.template[0].body' },
                doc: { ref: 'parseItemStructure.vars.structuredItem' },
                metaDependencies: {
                  helper: 'fromJson',
                  params: {
                    string: { ref: 'IndicateDependencies.results.updateItemDependencies[0].Payload' },
                  }
                }
              },
            },
            func: { 
              value: ({template, doc, metaDependencies}) => {
                return _.template(template.toString())({...doc.frontMatter, ...{ content: mdr.render(doc.content)}, ...metaDependencies})
              }
            }
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
                CacheControl: 'no-cache',
                Key: {
                  helper: 'transform', 
                  params:{
                    arg: {ref: 'identifyItemToRender.vars.key' },
                    func: {
                      value: (key) => {
                        const ar = key.split('.')
                        ar.pop()
                        ar.pop()
                        ar.push('html')
                        return ar.join('.')
                      }
                    }
                  }
                }
              }
            }
          },
        }
      },
    },
  },
}
