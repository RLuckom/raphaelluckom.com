window.GOPHER_CONFIG = {
  awsDependencies: {
    putImage: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Body: {
          input: 'buffer',
          formatter: ({buffer}) => {
            return buffer
          }
        },
        Bucket: {value: CONFIG.private_storage_bucket },
        Key: { 
          input: ['imageExt', 'postId', 'imageId'],
          formatter: ({imageExt, postId, imageId}) => {
            return getImageUploadKey({postId, imageId, imageExt})
          }
        },
      }
    },
    getPost: {
      accessSchema: exploranda.dataSources.AWS.s3.getObject,
      formatter: ([post]) => {
        let parsed
        if (post) {
          parsed = parsePost(post.Body.toString('utf8'))
          parsed.etag = post.ETag
        }
        return parsed
      },
      params: {
        Bucket: {value: CONFIG.private_storage_bucket },
        Key: { 
          input: 'postId',
          formatter: ({postId}) => {
            return getPostHostingKey({postId})
          }
        },
      },
      behaviors: {
        maybeNull: true,
        detectErrors: (err, res) => {
          if (err && err.name === "NoSuchKey") {
            return
          }
          if (err || !res) {
            return err
          }
        }
      }
    },
    saveAndPublishPostWithoutInput: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Body: {
          source: 'getPost',
          formatter: ({getPost}) => {
            const postToSend = _.cloneDeep(getPost)
            delete postToSend.frontMatter.unpublish
            delete postToSend.frontMatter.delete
            postToSend.frontMatter.publish = true
            return serializePost(postToSend)
          }
        },
        Bucket: {value: CONFIG.private_storage_bucket },
        ContentType: { value: 'text/markdown' },
        Key: { 
          input: 'postId',
          formatter: ({postId}) => {
            return getPostUploadKey({postId})
          }
        },
      }
    },
    unpublishPostWithoutInput: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Body: {
          source: 'getPost',
          formatter: ({getPost}) => {
            const postToSend = _.cloneDeep(getPost)
            delete postToSend.frontMatter.publish
            delete postToSend.frontMatter.delete
            postToSend.frontMatter.unpublish = true
            return serializePost(postToSend)
          }
        },
        Bucket: {value: CONFIG.private_storage_bucket },
        ContentType: { value: 'text/markdown' },
        Key: { 
          input: 'postId',
          formatter: ({postId}) => {
            return getPostUploadKey({postId})
          }
        },
      }
    },
    deletePostWithoutInput: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Body: {
          source: 'getPost',
          formatter: ({getPost}) => {
            const postToSend = _.cloneDeep(getPost)
            delete postToSend.frontMatter.publish
            delete postToSend.frontMatter.unpublish
            postToSend.frontMatter.delete = true
            return serializePost(postToSend)
          }
        },
        Bucket: {value: CONFIG.private_storage_bucket },
        ContentType: { value: 'text/markdown' },
        Key: { 
          input: 'postId',
          formatter: ({postId}) => {
            return getPostUploadKey({postId})
          }
        },
      }
    },
    savePostWithoutPublishing: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Body: {
          input: 'post',
          formatter: ({post}) => {
            const postToSend = _.cloneDeep(post)
            postToSend.frontMatter.updateDate = new Date().toISOString(),
            postToSend.frontMatter.date = new Date().toISOString(),
            postToSend.frontMatter.createDate = postToSend.frontMatter.createDat || new Date().toISOString(),
            delete postToSend.frontMatter.publish
            delete postToSend.frontMatter.unpublish
            delete postToSend.frontMatter.delete
            return serializePost(postToSend)
          }
        },
        Bucket: {value: CONFIG.private_storage_bucket },
        ContentType: { value: 'text/markdown' },
        Key: { 
          input: 'postId',
          formatter: ({postId}) => {
            return getPostUploadKey({postId})
          }
        },
      }
    },
    saveAndPublishPost: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Body: {
          input: 'post',
          formatter: ({post}) => {
            const postToSend = _.cloneDeep(post)
            postToSend.frontMatter.updateDate = new Date().toISOString(),
            postToSend.frontMatter.date = new Date().toISOString(),
            postToSend.frontMatter.createDate = postToSend.frontMatter.createDat || new Date().toISOString(),
            delete postToSend.frontMatter.unpublish
            delete postToSend.frontMatter.delete
            postToSend.frontMatter.publish = true
            return serializePost(postToSend)
          }
        },
        Bucket: {value: CONFIG.private_storage_bucket },
        ContentType: { value: 'text/markdown' },
        Key: { 
          input: 'postId',
          formatter: ({postId}) => {
            return getPostUploadKey({postId})
          }
        },
      }
    },
    unpublishPost: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Body: {
          input: 'post',
          formatter: ({post}) => {
            const postToSend = _.cloneDeep(post)
            postToSend.frontMatter.updateDate = new Date().toISOString(),
            postToSend.frontMatter.date = new Date().toISOString(),
            postToSend.frontMatter.createDate = postToSend.frontMatter.createDat || new Date().toISOString(),
            delete postToSend.frontMatter.publish
            delete postToSend.frontMatter.delete
            postToSend.frontMatter.unpublish = true
            return serializePost(postToSend)
          }
        },
        Bucket: {value: CONFIG.private_storage_bucket },
        ContentType: { value: 'text/markdown' },
        Key: { 
          input: 'postId',
          formatter: ({postId}) => {
            return getPostUploadKey({postId})
          }
        },
      }
    },
    deletePost: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Body: {
          input: 'post',
          formatter: ({post}) => {
            const postToSend = _.cloneDeep(post)
            delete postToSend.frontMatter.publish
            delete postToSend.frontMatter.unpublish
            postToSend.frontMatter.delete = true
            return serializePost(postToSend)
          }
        },
        Bucket: {value: CONFIG.private_storage_bucket },
        ContentType: { value: 'text/markdown' },
        Key: { 
          input: 'postId',
          formatter: ({postId}) => {
            return getPostUploadKey({postId})
          }
        },
      }
    },
    listPosts: {
      accessSchema: exploranda.dataSources.AWS.s3.listObjects,
      params: {
        Bucket: {value: CONFIG.private_storage_bucket },
        Prefix: { value: CONFIG.plugin_post_hosting_path },
      }
    },
  },
  otherDependencies: {
    pollImage: {
      accessSchema: {
        name: 'GET url',
        dataSource: 'GENERIC_API',
        value: {path:  _.identity},
      },
      params: {
        apiConfig: {
          input: ['imageExt', 'postId', 'imageId', 'imageSize'],
          formatter: ({imageExt, postId, imageId, imageSize}) => {
            return {
              method: 'HEAD',
              url: getImagePrivateUrl({postId, imageId, ext: imageExt, size: imageSize})
            }
          },
        },
        dependency: {
          source: 'putImage',
          formatter: _.identity
        }
      },
      behaviors: {
        retryParams: {
          errorFilter: (err) => {
            return err === 404
          },
          times: 10,
          interval: (n) => n * 1000
        },
        detectErrors: (err, res) => {
          if (err || !res) {
            return err
          }
        }
      }
    },
  },
}
