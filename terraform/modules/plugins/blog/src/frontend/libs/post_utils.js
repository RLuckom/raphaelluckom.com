function getPostUploadKey({postId}) {
    return `${CONFIG.plugin_post_upload_path}${postId}.md`
}

function getPostHostingKey({postId}) {
    return `${CONFIG.plugin_post_hosting_path}${postId}.md`
}

function getImageUploadKey({postId, imageId, ext}) {
  return `${CONFIG.plugin_image_upload_path}${postId}/${imageId}.${ext}`
}

const canonicalImageTypes = {
  png: 'png', 
  jpg: 'jpg',
  jpeg: 'jpg',
  tif: 'tif',
  tiff: 'tif',
  webp: 'webp',
  heic: 'heic',
  svg: 'svg',
  gif: 'gif',
}

function getImagePrivateUrl({postId, imageId, size, ext}) {
  const canonicalExt = canonicalImageTypes[_.toLower(ext)]
  if (!canonicalExt) {
    throw new Error("unsupported image type")
  }
  return `https://${CONFIG.domain}/${CONFIG.plugin_image_hosting_path}${postId}/${imageId}/${size}.${canonicalExt}`
}

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

function constructPost({imageIds, postContent, author, date, draft, title, trails}) {
  return {
    frontMatter: {
      title,
      author,
      date: date || new Date().toISOString(),
      draft: draft || false,
      meta: {
        trails,
        imageIds
      }
    },
    postContent
  }
}

function serializePost({frontMatter, postContent}) {
  return `---\n${yaml.dump(frontMatter)}---\n${postContent}`
}

goph = buildGopher({
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
})
