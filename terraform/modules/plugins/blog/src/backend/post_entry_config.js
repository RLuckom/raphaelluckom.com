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
      const fm = yaml.load(frontMatter)
      if (fm.date) {
        fm.date = moment(fm.date)
      }
      return { frontMatter: fm, content, raw:s }
    } catch(e) {
      return { raw: s } 
    }
  } else {
    return { raw: s }
  }
}

const blogImageKeyRegExp = new RegExp('${blog_image_hosting_prefix}([^/]*)/([^\.]*)/([0-9]*)\.(.*)')
const originalImageKeyRegExp = new RegExp('${blog_image_hosting_prefix}([^/]*)/([^\.]*)/([0-9]*)\.(.*)')

module.exports = {
  stages: {
    parsePost: {
      index: 0,
      transformers: {
        postId: {
          helper: ({originalKey}) => originalKey.split('/').pop().split('.')[0],
          params: {
            originalKey: {ref: 'event.Records[0].s3.object.key'},
          }
        }
      },
      dependencies: {
        current: {
          action: 'exploranda',
          formatter: ({current}) => {
            return parsePost(current[0].Body.toString('utf8'))
          },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.getObject'},
            explorandaParams: {
              Bucket: {ref: 'event.Records[0].s3.bucket.name'},
              Key: {ref: 'event.Records[0].s3.object.key'},
            }
          },
        },
        previous: {
          action: 'exploranda',
          formatter: ({previous}) => {
            if (previous.length) {
              return parsePost(previous[0].Body.toString('utf8'))
            }
            return null
          },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.getObject'},
            behaviors: { value: {
              onError: (e, r) => {
                return {
                  err: null,
                  res: []
                }
              }
            }},
            explorandaParams: {
              Bucket: {value: '${website_bucket}'},
              Key: {
                helper: ({postId}) => "${blog_post_hosting_prefix}" + postId + '.md',
                params: {
                  postId: {ref: 'stage.postId'},
                }
              },
            }
          },
        },
        availableImages: {
          action: 'exploranda',
          formatter: ({availableImages}) => {
            return _.map(_.flatten(availableImages), ({Key}) => {
              const [match, postId, imageId, size, ext] = originalImageKeyRegExp.exec(Key)
              return {key: Key, postId, imageId, size, ext}
            })
          },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.listObjects'},
            explorandaParams: {
              Bucket: {ref: 'event.Records[0].s3.bucket.name'},
              Prefix: {
                helper: ({postId}) => "${original_image_hosting_prefix}" + postId,
                params: {
                  postId: {ref: 'stage.postId'},
                }
              }
            }
          },
        },
        publishedImages: {
          action: 'exploranda',
          formatter: ({publishedImages}) => {
            return _.map(_.flatten(publishedImages), ({Key}) => {

              const [key, postId, imageId, size, ext] = blogImageKeyRegExp.exec(Key) 
              return {key, postId, imageId, size, ext}
            })
          },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.listObjects'},
            explorandaParams: {
              Bucket: {value: '${website_bucket}'},
              Prefix: {
                helper: ({postId}) => "${blog_image_hosting_prefix}" + postId,
                params: {
                  postId: {ref: 'stage.postId'},
                }
              }
            }
          },
        },
      }
    },
    publish: {
      index: 1,
      transformers: {
        publish: {
          helper: ({publish, unpublish}) => publish && !unpublish,
          params: {
            publish: {ref: 'parsePost.results.current.frontMatter.publish' },
            unpublish: {ref: 'parsePost.results.current.frontMatter.unpublish' },
          }
        },
        unpublish: {ref: 'parsePost.results.current.frontMatter.unpublish' },
        imagesToUnpublish: {
          helper: ({publishedImages, unpublish, currentImageIds}) => {
            if (unpublish) {
              return publishedImages
            } else {
              return _.filter(publishedImages, ({imageId}) => currentImageIds.indexOf(imageId) === -1)
            }
          },
          params: {
            unpublish: {ref: 'parsePost.results.current.frontMatter.unpublish' },
            currentImageIds: {ref: 'parsePost.results.current.frontMatter.meta.imageIds' },
            publishedImages: {ref: 'parsePost.results.publishedImages' },
          }
        },
        imagesToPublish: {
          helper: ({unpublish, publish, currentImageIds, availableImages}) => {
            if (unpublish || !publish) {
              return []
            } else {
              return _.filter(availableImages, ({imageId}) => currentImageIds.indexOf(imageId) !== -1)
            }
          },
          params: {
            publish: {ref: 'parsePost.results.current.frontMatter.publish' },
            unpublish: {ref: 'parsePost.results.current.frontMatter.unpublish' },
            availableImages: {ref: 'parsePost.results.availableImages' },
            currentImageIds: {ref: 'parsePost.results.current.frontMatter.meta.imageIds' },
          }
        },
      },
      dependencies: {
        savePost: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.putObject'},
            explorandaParams: {
              Bucket: {ref: 'event.Records[0].s3.bucket.name'},
              Key: {
                helper: ({originalKey}) => _.replace(originalKey, "${original_post_upload_prefix}", "${original_post_hosting_prefix}"),
                  params: {
                  originalKey: {ref: 'event.Records[0].s3.object.key'},
                }
              },
              ContentType: { value: 'text/markdown' },
              Body: {ref: 'parsePost.results.current.raw' },
            }
          },
        },
        publishPost: {
          action: 'exploranda',
          condition: { ref: 'stage.publish' },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.putObject'},
            explorandaParams: {
              Bucket: {value: '${website_bucket}'},
              Key: {
                helper: ({originalKey}) => "${blog_post_hosting_prefix}" + originalKey.split('/').pop(),
                  params: {
                  originalKey: {ref: 'event.Records[0].s3.object.key'},
                }
              },
              ContentType: { value: 'text/markdown' },
              Body: {
                helper: ({postString}) => _.replace(postString, "${original_image_hosting_root}", "${blog_image_hosting_root}"),
                  params: {
                  postString: {ref: 'parsePost.results.current.raw' },
                }
              }
            }
          },
        },
        unpublishPost: {
          action: 'exploranda',
          condition: { ref: 'stage.unpublish' },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.deleteObject'},
            explorandaParams: {
              Bucket: {value: '${website_bucket}'},
              Key: {
                helper: ({originalKey}) => "${blog_post_hosting_prefix}" + originalKey.split('/').pop(),
                  params: {
                  originalKey: {ref: 'event.Records[0].s3.object.key'},
                }
              },
            }
          },
        },
      }
    },
    manageImages: {
      index: 2,
      dependencies: {
        publish: {
          action: 'exploranda',
          condition: {ref: 'publish.vars.imagesToPublish.length' },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.copyObject'},
            explorandaParams: {
              Bucket: {value: '${website_bucket}'},
              CopySource: {
                helper: ({images, bucket}) => _.map(images, ({key}) => "/" + bucket + "/" + key),
                params: {
                  images: {ref: 'publish.vars.imagesToPublish' },
                  bucket: {ref: 'event.Records[0].s3.bucket.name'},
                }
              },
              Key: {
                helper: ({images}) => _.map(images, ({key}) => _.replace(key, "${original_image_hosting_prefix}", "${blog_image_hosting_prefix}")),
                  params: {
                  images: {ref: 'publish.vars.imagesToPublish' },
                }
              }
            }
          },
        },
        unpublish: {
          action: 'exploranda',
          condition: {ref: 'publish.vars.imagesToUnpublish.length' },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.deleteObject'},
            explorandaParams: {
              Bucket: {
                helper: ({images, bucket}) => {
                  const n = _.map(images, (id) => bucket)
                  return n
                },
                params: {
                  images: {ref: 'publish.vars.imagesToUnpublish' },
                  bucket: {value: '${website_bucket}'},
                }
              },
              Key: {
                helper: ({images, bucket}) => {
                  const n = _.map(images, 'key')
                  return n
                },
                params: {
                  images: {ref: 'publish.vars.imagesToUnpublish' },
                  bucket: {value: '${website_bucket}'},
                }
              }
            }
          },
        },
      }
    },
  },
}
