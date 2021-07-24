const _ = require('lodash')
const yaml = require('js-yaml')
const { packagePostAccessSchema } = require('./helpers/packagePost')

const blogImageKeyRegExp = new RegExp('${blog_image_hosting_prefix}([^/]*)/([^\.]*)/([0-9]*)\.(.*)')
const pluginImageKeyRegExp = new RegExp('${blog_image_hosting_prefix}([^/]*)/([^\.]*)/([0-9]*)\.(.*)')

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
      return { frontMatter: fm, content, raw:s }
    } catch(e) {
      console.error(e)
      return { raw: s} 
    }
  } else {
    return { raw: s }
  }
}

function postRecordToDynamo(id, pr) {
  return {kind: 'post', id, frontMatter: pr.frontMatter}
}

function serializePostToMarkdown({frontMatter, content}) {
  let text = '---\n' + yaml.dump(frontMatter) + '---\n' + content
  return text
}

module.exports = {
  stages: {
    parsePost: {
      index: 0,
      transformers: {
        postId: {
          helper: ({pluginKey}) => {
            const parts = pluginKey.split('/').pop().split('.')
            parts.pop()
            return parts.join('.')
          },
          params: {
            pluginKey: {ref: 'event.Records[0].s3.object.decodedKey'},
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
              Key: {ref: 'event.Records[0].s3.object.decodedKey'},
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
              const [match, postId, imageId, size, ext] = pluginImageKeyRegExp.exec(Key)
              return {key: Key, postId, imageId, size, ext}
            })
          },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.listObjects'},
            explorandaParams: {
              Bucket: {ref: 'event.Records[0].s3.bucket.name'},
              Prefix: {
                helper: ({postId}) => "${plugin_image_hosting_prefix}" + postId,
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
        delete: {ref: 'parsePost.results.current.frontMatter.delete' },
        unpublish: {ref: 'parsePost.results.current.frontMatter.unpublish' },
        imagesToDelete: {
          helper: ({availableImages, currentImageIds, del}) => {
            if (del) {
              return availableImages
            }
            return _.filter(availableImages, ({imageId}) => {
              return currentImageIds.indexOf(imageId) === -1
            })
          },
          params: {
            currentImageIds: {ref: 'parsePost.results.current.frontMatter.meta.imageIds' },
            availableImages: {ref: 'parsePost.results.availableImages' },
            del: {ref: 'parsePost.results.current.frontMatter.delete' },
          }
        },
        imagesToPublish: {
          helper: ({unpublish, del, publish, currentImageIds, availableImages}) => {
            if (unpublish || !publish || del) {
              return []
            } else {
              return _.filter(availableImages, ({imageId}) => currentImageIds.indexOf(imageId) !== -1)
            }
          },
          params: {
            publish: {ref: 'parsePost.results.current.frontMatter.publish' },
            unpublish: {ref: 'parsePost.results.current.frontMatter.unpublish' },
            del: {ref: 'parsePost.results.current.frontMatter.delete' },
            availableImages: {ref: 'parsePost.results.availableImages' },
            currentImageIds: {ref: 'parsePost.results.current.frontMatter.meta.imageIds' },
          }
        },
        dynamoPuts: {
          helper: ({post, postId, isDelete}) => {
            if (!isDelete) {
              return [postRecordToDynamo(postId, post)]
            }
            return []
          },
          params: {
            isDelete: {ref: 'parsePost.results.current.frontMatter.delete' },
            post: {ref: 'parsePost.results.current' },
            postId: {ref: 'parsePost.vars.postId'},
          }
        },
      },
      dependencies: {
        dynamoPuts: {
          action: 'exploranda',
          condition: { ref: 'stage.dynamoPuts.length' },
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.putItem'},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: '${table_region}'}},
                TableName: '${table_name}',
                Item: { ref: 'stage.dynamoPuts' }
              }
            }
          }
        },
        savePost: {
          action: 'exploranda',
          condition: {not: { ref: 'stage.delete' }},
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.putObject'},
            explorandaParams: {
              Bucket: {ref: 'event.Records[0].s3.bucket.name'},
              Key: {
                helper: ({pluginKey}) => _.replace(pluginKey, "${plugin_post_upload_prefix}", "${plugin_post_hosting_prefix}"),
                  params: {
                  pluginKey: {ref: 'event.Records[0].s3.object.decodedKey'},
                }
              },
              ContentType: { value: 'text/markdown' },
              Body: {ref: 'parsePost.results.current.raw' },
            }
          },
        },
        deletePost: {
          action: 'exploranda',
          condition: { ref: 'stage.delete' },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.deleteObject'},
            explorandaParams: {
              Bucket: {ref: 'event.Records[0].s3.bucket.name'},
              Key: {
                helper: ({pluginKey}) => _.replace(pluginKey, "${plugin_post_upload_prefix}", "${plugin_post_hosting_prefix}"),
                params: {
                  pluginKey: {ref: 'event.Records[0].s3.object.decodedKey'},
                }
              },
            }
          },
        },
        unpublishPost: {
          action: 'exploranda',
          condition: {or: [
            { ref: 'stage.unpublish' },
            { ref: 'stage.delete' },
          ]},
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.deleteObject'},
            explorandaParams: {
              Bucket: {value: '${website_bucket}'},
              Key: {
                helper: ({postId}) => "${blog_post_hosting_prefix}" + postId + '.zip',
                  params: {
                  postId: {ref: 'parsePost.vars.postId'},
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
        getImagesToPublish: {
          action: 'exploranda',
          condition: {ref: 'publish.vars.imagesToPublish.length' },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.getObject'},
            explorandaParams: {
              Bucket: { ref: 'event.Records[0].s3.bucket.name'},
              Key: {
                helper: ({images}) => _.map(images, 'key'),
                params: {
                  images: {ref: 'publish.vars.imagesToPublish' },
                }
              },
            }
          },
        },
        delete: {
          action: 'exploranda',
          condition: {ref: 'publish.vars.imagesToDelete.length'},
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.deleteObject'},
            explorandaParams: {
              Bucket: {
                helper: ({images, bucket}) => {
                  const n = _.map(images, (id) => bucket)
                  return n
                },
                params: {
                  images: {ref: 'publish.vars.imagesToDelete' },
                  bucket: {ref: 'event.Records[0].s3.bucket.name'},
                }
              },
              Key: {
                helper: ({images}) => {
                  const n = _.map(images, 'key')
                  return n
                },
                params: {
                  images: {ref: 'publish.vars.imagesToDelete' },
                }
              }
            }
          },
        },
      }
    },
    packagePost: {
      index: 3,
      dependencies: {
        zip: {
          formatter: ({zip}) => {
            return zip
          },
          action: 'exploranda',
          params: {
            accessSchema: {value: packagePostAccessSchema},
            explorandaParams: {
              images: {
                helper: ({imageBuffers, imageConfigs}) => {
                  return _.reduce(imageBuffers, (acc, v, i) => {
                    const {imageId, size, ext} = imageConfigs[i]
                    const name = imageId + '/' + size + '.' + ext
                    acc[name] = v.Body
                    return acc
                  }, {})
                },
                params: {
                  imageBuffers: { ref: 'manageImages.results.getImagesToPublish'}, 
                  imageConfigs: {ref: 'publish.vars.imagesToPublish' },
                }
              },
              postText: {ref: 'parsePost.results.current.raw' },
              postId: {ref: 'parsePost.vars.postId'},
              imageRoot: {
                helper: ({postId}) => "${plugin_image_hosting_prefix}" + postId,
                params: {
                  postId: {ref: 'stage.postId'},
                }
              }
            }
          }
        }
      }
    },
    publishPost: {
      index: 4,
      transformers: {},
      dependencies: {
        publishPost: {
          action: 'exploranda',
          condition: { ref: 'publish.vars.publish' },
          params: {
            accessSchema: {value: 'dataSources.AWS.s3.putObject'},
            explorandaParams: {
              Bucket: {value: '${website_bucket}'},
              Key: {
                helper: ({postId}) => "${blog_post_hosting_prefix}" + postId + '.zip',
                  params: {
                  postId: {ref: 'parsePost.vars.postId'},
                }
              },
              ContentType: { value: 'application/zip' },
              Body: {ref : 'packagePost.results.zip' }
            }
          },
        },
      }
    },
    cleanupDB: {
      index: 5,
      transformers: {
        dynamoDeletes: {
          helper: ({postId, isDelete}) => {
            if (isDelete) {
              return [{kind: 'post', id: postId}]
            }
            return []
          },
          params: {
            isDelete: {ref: 'parsePost.results.current.frontMatter.delete' },
            postId: {ref: 'parsePost.vars.postId'},
          }
        },
      },
      dependencies: {
        dynamoDeletes: {
          action: 'exploranda',
          condition: { ref: 'stage.dynamoDeletes.length' },
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.deleteItem'},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: '${table_region}'}},
                TableName: '${table_name}',
                Key: { ref: 'stage.dynamoDeletes' }
              }
            }
          }
        },
      }
    }
  },
}
