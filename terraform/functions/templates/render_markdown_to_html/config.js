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

function identifyItem(resourcePath, siteDescription, selectionPath) {
  if (!selectionPath) {
    selectionPath = ['relations']
  }
  for (key in _.get(siteDescription, selectionPath)) {
    const reString = _.get(siteDescription, _.concat(selectionPath, [key, 'pathNameRegex']))
    if (key !== 'meta' && reString) {
      const re = new RegExp(reString)
      if (re.test(resourcePath)) {
        const name = re.exec(resourcePath)[1]
        selectionPath.push(key)
        return {
          type: key,
          typeDef: _.get(siteDescription, selectionPath),
          name,
          uri: urlTemplate.parse(_.get(siteDescription, _.concat(selectionPath, ['idTemplate']))).expand({...siteDescription.siteDetails, ...{name}})
        }
      }
    }
  }
  if (_.get(siteDescription, _.concat(selectionPath, ['meta']))) {
    selectionPath.push('meta')
    return identifyItem(resourcePath, siteDescription, selectionPath)
  }
}

module.exports = {
  stages: {
    identifyItemToRender: {
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
        item: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                siteDescription: {ref: 'identifyItemToRender.results.siteDescription[0].body'}, 
                resourcePath: {ref: 'identifyItemToRender.vars.key'},
              }
            },
            func: ({resourcePath, siteDescription}) => identifyItem(resourcePath, siteDescription)
          }
        },
        siteDescription: {ref: 'identifyItemToRender.results.siteDescription[0].body'}, 
      },
      dependencies: {
        text: {
          action: 'exploranda',
          params: {
            accessSchema: {
              all: {
                dataSource: { value: 'GENERIC_API' },
                url: {ref: 'stage.item.uri'},
                onError: (err, res) => {
                  console.log(err)
                  console.log(res)
                  return {err, res}
                }
              }
            }
          }
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
              value: parsePost
            },
            arg: {ref: 'getItemToRender.results.text[0].body' }
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
            arg: {
              all: {
               item: { ref: 'getItemToRender.vars.item' },
               siteDescription: {ref: 'identifyItemToRender.results.siteDescription[0].body'}, 
              }
            },
            func: {
              value: ({item, siteDescription}) => {
                const template = urlTemplate.parse(_.get(item, ['typeDef', 'formats', 'html', 'render', 'template']))
                return template.expand(siteDescription.siteDetails)
              }
            }
          }
        },
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
            name: { ref: 'getItemToRender.vars.item.name' },
            trailNames: {
              helper: 'transform',
              params: {
                arg: {
                  all: {
                    specific: {ref: 'parseItemStructure.vars.structuredItem.frontMatter.meta.trail'},
                    general: { ref: 'getItemToRender.vars.item.typeDef.meta.trail.default' },
                  },
                },
                func: {value: ({specific, general}) => _.concat(specific, general) }
              }
            },
            metadata: {ref: 'parseItemStructure.vars.structuredItem.frontMatter'},
            id: { ref: 'getItemToRender.vars.item.uri' },
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
