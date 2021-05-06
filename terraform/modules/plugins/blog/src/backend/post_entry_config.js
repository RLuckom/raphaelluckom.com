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
      return { raw: s } 
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
            if (previous) {
              return parsePost(previous[0].Body.toString('utf8'))
            }
            return null
          },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.getObject'},
            behaviors: { value: {
              onError: (e, r) => {
                return
              }
            }},
            explorandaParams: {
              Bucket: {ref: 'event.Records[0].s3.bucket.name'},
              Key: {
                helper: ({originalKey}) => _.replace(originalKey, "${original_post_upload_prefix}", "${original_post_hosting_prefix}"),
                  params: {
                  originalKey: {ref: 'event.Records[0].s3.object.key'},
                }
              },
            }
          },
        },
      }
    },
    publish: {
      index: 1,
      transformers: {
        publish: {
          helper: ({draft, unpublish}) => !draft && !unpublish,
          params: {
            draft: {ref: 'parsePost.results.current.frontMatter.draft' },
            unpublish: {ref: 'parsePost.results.current.frontMatter.unpublish' },
          }
        },
        unpublish: {ref: 'parsePost.results.current.frontMatter.unpublish' },
        imageIdsToUnpublish: {
          helper: ({unpublish, previousImageIds, currentImageIds}) => {
            if (unpublish) {
              return _.union(previousImageIds || [], currentImageIds)
            } else {
              return _.difference(previousImageIds || [], currentImageIds)
            }
          },
          params: {
            unpublish: {ref: 'parsePost.results.current.frontMatter.unpublish' },
            previousImageIds: {ref: 'parsePost.results.previous.frontMatter.meta.imageIds' },
            currentImageIds: {ref: 'parsePost.results.current.frontMatter.meta.imageIds' },
          }
        },
        imageIdsToPublish: {
          helper: ({unpublish, draft, currentImageIds}) => {
            if (unpublish || draft) {
              return []
            } else {
              return currentImageIds
            }
          },
          params: {
            draft: {ref: 'parsePost.results.current.frontMatter.draft' },
            unpublish: {ref: 'parsePost.results.current.frontMatter.unpublish' },
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
        unPublishPost: {
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
        imagesToCopy: {
          action: 'exploranda',
          condition: { ref: 'stage.publish' },
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
                  imageIds: {ref: 'stage.imageIdsToPublish' },
                  bucket: {ref: 'event.Records[0].s3.bucket.name'},
                }
              },
              Prefix: {
                helper: ({imageIds}) => _.map(imageIds, (id) => "${original_image_hosting_prefix}" + id),
                  params: {
                  imageIds: {ref: 'stage.imageIdsToPublish' },
                }
              }
            }
          },
        },
        imagesToDelete: {
          action: 'exploranda',
          condition: { ref: 'stage.unpublish' },
          formatter: ({imagesToDelete}) => {
            console.log(imagesToDelete)
            return _.map(_.flatten(imagesToDelete), 'Key')
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
                  imageIds: {ref: 'stage.imageIdsToUnpublish' },
                  bucket: {value: '${website_bucket}'},
                }
              },
              Prefix: {
                helper: ({imageIds}) => _.map(imageIds, (id) => "${blog_image_hosting_prefix}" + id),
                  params: {
                  imageIds: {ref: 'stage.imageIdsToUnpublish' },
                }
              }
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
          condition: {ref: 'publish.results.imagesToCopy.length' },
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
                helper: ({imageKeys}) => _.map(imageKeys, (k) => _.replace(k, "${original_image_hosting_prefix}", "${blog_image_hosting_prefix}")),
                  params: {
                  imageKeys: {ref: 'publish.results.imagesToCopy' },
                }
              }
            }
          },
        },
        unpublish: {
          action: 'exploranda',
          condition: {ref: 'publish.results.imagesToDelete.length' },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.deleteObject'},
            explorandaParams: {
              Bucket: {
                helper: ({imageKeys, bucket}) => {
                  const n = _.map(imageKeys, (id) => bucket)
                  console.log(n)
                  return n
                },
                params: {
                  imageKeys: {ref: 'publish.results.imagesToDelete' },
                  bucket: {value: '${website_bucket}'},
                }
              },
              Key: {ref: 'publish.results.imagesToDelete' },
            }
          },
        },
      }
    },
  },
}
