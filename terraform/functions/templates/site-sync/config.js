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
const t = `<!DOCTYPE html>
<html lang="en-us">
  <head>
    <title>
         <%= title %>
    </title>
  </head>
  <body>

<section id=content>
  <h1> <%= title %> </h1>

  
    <div id=sub-header>
      <%= date %>
    </div>
    <div class="entry-content">
<%= content %>
    </div>
  </body>
</html>
`

const namespaceDetails = {
  name: 'S3',
  constructorArgs: {}
};

const putObject = {
  dataSource: 'AWS',
  namespaceDetails,
  name: 'putObject',
  value: {
    path: _.identity,
  },
  apiMethod: 'putObject',
  requiredParams: {
    Bucket: {},
    Body: {},
    Key: {},
  },
  optionalParams: {
    CacheControl: {},
    ContentDisposition: {},
    ContentEncoding: {},
    ContentLanguage: {},
    ContentLength: {},
    ContentMD5: {},
    ContentType: {},
    ExpectedBucketOwner: {},
    Expires: {},
    GrantFullControl: {},
    GrantRead: {},
    GrantReadACP: {},
    GrantWriteACP: {},
    Metadata: {},
    ObjectLockLegalHoldStatus: {},
    ObjectLockMode: {},
    ObjectLockRetainUntilDate: {},
    RequestPayer: {},
    SSECustomerAlgorithm: {},
    SSECustomerKey: {}, 
    SSECustomerKeyMD5: {},
    SSEKMSEncryptionContext: {},
    SSEKMSKeyId: {},
    ServerSideEncryption: {},
    StorageClass: {},
    Tagging: {},
    WebsiteRedirectLocation: {}
  }
};

function parsePost(s) {
  const t = _(s.split('\n')).filter().map(_.trim).value()
  if (t[0] === '---') {
    let started = false
    let frontMatter = ''
    let post = ''
    for (r of t.slice(1)) {
      if (r === '---') {
        if (!started) {
          started = true
        }
      } else {
        if (started) {
          post += r + "\n"
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
      return { frontMatter: fm, post: post, raw:s }
    } catch(e) {
      console.log(e)
      return { raw: s} 
    }
  } else {
    return { raw: s }
  }
}

const temp = _.template(t)
module.exports = {
  stages: {
    getChangedMarkdown: {
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
    postMarkdownToWebsiteBucket: {
      index: 1,
      transformers: {
        fileContent: {
          helper: 'transform',
          params: {
            func: {
              value: (x) => {
                const post = parsePost(x.toString())
                return temp({
                  title: post.frontMatter.title,
                  date: post.frontMatter.date,
                  content: mdr.render(post.post, {})
                })
              }
            },
            arg: {ref: 'getChangedMarkdown.results.text[0].Body' }
          }
        }
      },
      dependencies: {
        uploadHtml: {
          action: 'exploranda',
          params: {
            accessSchema: {value: putObject},
            params: {
              explorandaParams: {
                Body: {ref: 'stage.fileContent' },
                Bucket: '${website_bucket}',
                ContentType: 'text/html',
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
  cleanup: {
  }
}
