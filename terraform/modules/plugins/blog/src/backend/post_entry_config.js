const _ = require('lodash')
const moment = require('moment')
const yaml = require('js-yaml')
function parsePost(s) {
  const t = s.split('\n')
  if (_.trim(t[0]) === '---') {
    let started = false
    let frontMatter = ''
    let content = ''
    for (let r of t.slice(1)) {
      if (_.trim(r) === '---') {
        if (!started) {
          started = true
        } else {
          content += r + "\n"
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

module.exports = {
  stages: {
    parsePost: {
      index: 0,
      dependencies: {
        parsed: {
          action: 'exploranda',
          formatter: ({parsed}) => {
            return parsePost(parsed[0].Body.toString('utf8'))
          },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.getObject'},
            explorandaParams: {
              Bucket: {ref: 'event.Records[0].s3.bucket.name'},
              Key: {ref: 'event.Records[0].s3.object.key'},
            }
          },
        }
      }
    },
    publish: {
      index: 1,
      condition: {
        helper: ({draft}) => !draft,
        params: {
          draft: {ref: 'parsePost.results.parsed.frontMatter.draft' },
        }
      },
      dependencies: {
        post: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.putObject'},
            explorandaParams: {
              Bucket: {value: '${website_bucket}'},
              Key: {
                helper: ({originalKey}) => "posts/" + originalKey.split('/').pop(),
                params: {
                  originalKey: {ref: 'event.Records[0].s3.object.key'},
                }
              },
              ContentType: { value: 'text/markdown' },
              Body: {
                helper: ({postString}) => _.replace(postString, "${original_image_hosting_root}", "${blog_image_hosting_root}"),
                params: {
                  postString: {ref: 'parsePost.results.parsed.raw' },
                }
              }
            }
          },
        },
        imagesToCopy: {
          action: 'exploranda',
          formatter: ({imagesToCopy}) => {
            console.log(imagesToCopy)
            return _.map(_.flatten(imagesToCopy), 'Key')
          },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.listObjects'},
            explorandaParams: {
              Bucket: {
                helper: ({imageIds, bucket}) => {
                  const n = _.map(imageIds, (id) => bucket)
                  console.log(n)
                  return n
                },
                params: {
                  imageIds: {ref: 'parsePost.results.parsed.frontMatter.meta.imageIds' },
                  bucket: {ref: 'event.Records[0].s3.bucket.name'},
                }
              },
              Prefix: {
                helper: ({imageIds}) => _.map(imageIds, (id) => "${original_image_prefix}" + id),
                params: {
                  imageIds: {ref: 'parsePost.results.parsed.frontMatter.meta.imageIds' },
                }
              }
            }
          },
        },
      }
    },
    publishImages: {
      index: 2,
      condition: {
        helper: ({draft, imageKeys}) => !draft && imageKeys.length,
        params: {
          draft: {ref: 'parsePost.results.parsed.frontMatter.draft' },
          imageKeys: {ref: 'publish.results.imagesToCopy' },
        }
      },
      dependencies: {
        publish: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.copyObject'},
            explorandaParams: {
              Bucket: {value: '${website_bucket}'},
              CopySource: {
                helper: ({imageKeys, bucket}) => _.map(imageKeys, (k) => "/" + bucket + "/" + k),
                params: {
                  imageKeys: {ref: 'publish.results.imagesToCopy' },
                  bucket: {ref: 'event.Records[0].s3.bucket.name'},
                }
              },
              Key: {
                helper: ({imageKeys}) => _.map(imageKeys, (k) => _.replace(k, "${original_image_prefix}", "${public_hosting_image_prefix}")),
                params: {
                  imageKeys: {ref: 'publish.results.imagesToCopy' },
                }
              }
            }
          },
        },
      }
    },
  },
}
