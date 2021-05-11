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
      formatter: (post) => {
        console.log(post[0].Body.toString('utf8'))
        return parsePost(post[0].Body.toString('utf8'))
      },
      params: {
        Bucket: {value: CONFIG.private_storage_bucket },
        Key: { 
          input: 'postId',
          formatter: ({postId}) => {
            console.log(getPostHostingKey({postId}))
            return getPostHostingKey({postId})
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
            delete postToSend.publish
            delete postToSend.unpublish
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
          if (err) {
            return 404
          }
        }
      }
    },
  },
}
