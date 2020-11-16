const fs = require('fs')
const _ = require('lodash')
const yaml = require('js-yaml')
const moment = require('moment')
const hljs = require('highlight.js'); 

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
  const t = _(s.split('\n')).filter().map(_.trim).value()
  if (t[0] === '---') {
    let started = false
    let frontMatter = ''
    let content = ''
    for (r of t.slice(1)) {
      if (r === '---') {
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
    getChangedItem: {
      index: 0,
      dependencies: {
        text: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.getObject'},
            params: {
              explorandaParams: {
                Bucket: {ref: 'event.Records[0].s3.bucket.name' },
                Key: {ref: 'event.Records[0].s3.object.key'},
              }
            }
          },
        }
      },
    },
    parseItemStructure: {
      index: 1,
      transformers: {
        structuredItem: {
          helper: 'transform',
          params: {
            func: {
              value: (x) =>  parsePost(x.toString())
            },
            arg: {ref: 'getChangedItem.results.text[0].Body' }
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
                arg: { ref: 'stage.structuredItem.frontMatter' },
                func: {
                  value: ({baseUrl, template}) => {
                    let url
                    if (_.isString(template)) {
                      try {
                        url = new URL(template)
                      } catch(e) {
                        url = new URL(template, baseUrl)
                      }
                    } else {
                      url = new URL(template.path, template.baseUrl)
                    }
                    const as = {
                      dataSource: 'GENERIC_API',
                      host: url.host,
                      path: url.pathname,
                      protocol: _.trimEnd(url.protocol, ':') + '://',
                    }
                    console.log(as)
                    return as
                  }
                }
              }
            },
            params: {},
          },
        },
      },
    },
    postItemToWebsiteBucket: {
      index: 2,
      transformers: {
        fileContent: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                template: {ref: 'parseItemStructure.results.template[0].body' },
                doc: { ref: 'parseItemStructure.vars.structuredItem' },
              },
            },
            func: { 
              value: ({template, doc}) => {
                return _.template(template.toString())({...doc.frontMatter, ...{ content: mdr.render(doc.content, {})}})
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
                    arg: {ref: 'event.Records[0].s3.object.key'},
                    func: {
                      value: (key) => {
                        const ar = key.split('.')
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
    }
  },
}
