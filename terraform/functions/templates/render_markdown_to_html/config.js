const fs = require('fs')
const _ = require('lodash')
const yaml = require('js-yaml')
const moment = require('moment')
const hljs = require('highlight.js');
const urlTemplate = require('url-template')

const mdr = require('markdown-it')({
  html: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }
    return ''; // use external default escaping
  }
}).use(require('markdown-it-footnote'))

function unwrap(params) { 
  return _.reduce(params, (a, v, k) => {
    a[k] = v[0]
    return a
  }, {})
}

function unwrapHttpResponse(params) {
  return _.reduce(unwrap(params), (a, v, k) => {
    a[k] = v.body
    return a
  }, {})
}

function unwrapFunctionPayload(params) {
  return _.reduce(unwrap(params), (a, v, k) => {
    a[k] = JSON.parse(v.Payload)
    return a
  }, {})
}

function firstKey(params) {
  return params[_.keys(params)[0]]
}

function only(f) {
  return function(params) {
    return firstKey(f(params))
  }
}

const formatters = {
  singleValue: {
    unwrap: only(unwrap),
    unwrapHttpResponse: only(unwrapHttpResponse),
    unwrapFunctionPayload: only(unwrapFunctionPayload),
  },
  multiValue: {
    unwrap,
    unwrapHttpResponse,
    unwrapFunctionPayload
  }
}

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
  const pathRegexString = _.get(siteDescription, 'siteDetails.pathRegex')
  const pathRe = new RegExp(pathRegexString)
  if (pathRe.test(resourcePath)) {
    resourcePath = pathRe.exec(resourcePath)[1]
  }
  for (key in _.get(siteDescription, selectionPath)) {
    const reString = _.get(siteDescription, _.concat(selectionPath, [key, 'pathNameRegex']))
    if (key !== 'meta' && reString) {
      const re = new RegExp(reString)
      if (re.test(resourcePath)) {
        const name = re.exec(resourcePath)[1]
        selectionPath.push(key)
        const typeDef = _.get(siteDescription, selectionPath)
        const uriTemplateArgs = {...siteDescription.siteDetails, ...{name}}
        const formatUrls = _.reduce(_.get(typeDef, 'formats'), (a, v, k) => {
          const uriTemplateString = v.idTemplate
          if (uriTemplateString) {
            const formatUri = urlTemplate.parse(uriTemplateString).expand(uriTemplateArgs)
            a[k] = {
              uri: formatUri,
              path: pathRe.exec(formatUri)[1]
            }
          }
          return a
        }, {})
        return {
          type: key,
          typeDef,
          name,
          formatUrls,
          uri: urlTemplate.parse(_.get(siteDescription, _.concat(selectionPath, ['idTemplate']))).expand(uriTemplateArgs),
          path: resourcePath
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
          helper: 'transform',
          params: {
            arg: {
              all: {
                siteDescription: {ref: 'siteDescription.results.siteDescription'}, 
                resourcePath: {ref: 'siteDescription.vars.key'},
              }
            },
            func: ({resourcePath, siteDescription}) => identifyItem(resourcePath, siteDescription)
          }
        },
        siteDescription: {ref: 'siteDescription.results.siteDescription'}, 
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
      transformers: {
        metaResources: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                frontMatter: {ref: 'item.results.parsed.frontMatter'},
                siteDescription: {ref: 'siteDescription.results.siteDescription'},
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
               item: { ref: 'item.vars.metadata' },
               siteDescription: {ref: 'siteDescription.results.siteDescription'}, 
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
          formatter: formatters.singleValue.unwrapHttpResponse,
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
    meta: {
      condition: { ref: 'item.results.parsed' },
      index: 4,
      transformers: {
        item: {
          all: {
            name: { ref: 'item.vars.metadata.name' },
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
            metadata: {ref: 'item.results.parsed.frontMatter'},
            id: { ref: 'item.vars.metadata.uri' },
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
      condition: { ref: 'item.results.parsed' },
      index: 5,
      transformers: {
        fileContent: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                template: {ref: 'renderDependencies.results.template' },
                doc: { ref: 'item.results.parsed' },
                metaDependencies: { ref: 'meta.results.trails' },
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
                Key: { ref: 'item.vars.metadata.formatUrls.html.path' },
              }
            }
          },
        }
      },
    },
  },
}
