goph = buildGopher({
  awsDependencies: {
    listHostingRoot: listHostingRootDependency,
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
          input: 'putPath',
          formatter: ({putPath}) => {
            return putPath
          }
        },
      }
    },
    putPost: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Body: {
          input: 'post',
          formatter: ({post}) => {
            return post
          }
        },
        Bucket: {value: CONFIG.private_storage_bucket },
        ContentType: { value: 'text/markdown' },
        Key: { 
          input: 'postKey',
          formatter: ({postKey}) => {
            return postKey
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
          input: 'url',
          formatter: ({url}) => {
            return {
              method: 'HEAD',
              url
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

let currentPost
let postFilename

// https://gist.github.com/mbrehin/05c0d41a7e50eef7f95711e237502c85
// script to replace <textarea> elements in forms with prosemirror editors 
// ( if they have the .prosemirror class ) 
function initEditors() {
  const savedData = localStorage.getItem('postData')
  let initEditorState
  if (savedData) {
    const parsed = JSON.parse(savedData)
    currentPost = parsed.currentPost
    postFilename = parsed.postFilename
    initEditorState = parsed.editorState
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

  function uploadImage(buffer, ext, callback) {
    const rawName = uuid.v4()
    const canonicalExt = canonicalImageTypes[_.toLower(ext)]
    if (!canonicalExt) {
      throw new Error("unsupported image type")
    }
    const putPath = CONFIG.private_storage_image_upload_path + rawName
    const getUrl = `https://${CONFIG.domain}/${CONFIG.plugin_image_hosting_path}${rawName}/500.${canonicalExt}`
    goph.report(
      'pollImage',
      {
        putPath,
        url: getUrl,
        buffer,
      },
      (e, r) => {
        callback(e, {
          url: getUrl,
          imageId: rawName
        })
      }
    )
  }

  const autosave = _.debounce((currentPost, state) => {
    localStorage.setItem('postData', JSON.stringify({
      currentPost, postFilename, editorState: state,
    }))
  }, 2000)

  function onChange({imageIds, postContent, state}) {
    const titleInput = document.querySelector('#title').value
    const postId = titleInput.replace(/ /g, "_")
    postFilename = encodeURIComponent(`${postId}.md`)
    document.getElementById('post-title-filename').innerText = postFilename
    currentPost = constructPost({
      imageIds,
      postContent,
      draft: true,
      date: new Date().toISOString(),
      title: document.querySelector('#title').value,
      author: document.querySelector('#author').value,
      trails: _.map(document.querySelector('#trails').value.split(","), _.trim),
    })
    autosave(currentPost, state)
  }

  function uploadPost(post, name) {
    const postKey = `${CONFIG.private_storage_post_upload_path}${name}`
    goph.report(
      'putPost',
      {
        postKey,
        post,
      },
      (e, r) => {
        console.log(e)
        console.log(r)
      }
    )
  }

  goph.report('listPosts', null, (e, r) => {
    if (e) {
      console.log(e)
      return e
    }
    const postListSection = document.getElementById('posts')
    _.map(r.listPosts[0], ({Key}) => {
      const postListEntry = document.createElement('div')
      postListEntry.className = "post-entry"
      const postName = document.createElement('div')
      postName.className = "post-name"
      postName.innerText = _.trimEnd(Key.split('/').pop(), '.md')
      postListEntry.appendChild(postName)
      postListSection.appendChild(postListEntry)
    })
  })

  // Loop over every textareas to replace with dynamic editor
  for (const area of document.querySelectorAll('textarea.prosemirror')) {
    // Hide textarea
    area.style.display = 'none'
    // Create container zone
    const container = document.createElement('div')
    container.classList = area.classList
    if (area.nextSibling) {
      area.parentElement.insertBefore(container, area.nextSibling)
    } else {
      area.parentElement.appendChild(container)
    }
    const { view, plugins } = prosemirrorView(area, container, uploadImage, onChange, initEditorState)
  }
  document.getElementById('save').onclick = () => {
    const postToSave = _.cloneDeep(currentPost)
    uploadPost(serializePost(postToSave), postFilename)
  }
  document.getElementById('publish').onclick = () => {
    const postToPublish = _.cloneDeep(currentPost)
    postToPublish.frontMatter.draft = false
    uploadPost(serializePost(postToPublish), postFilename)
  }
  document.getElementById('unpublish').onclick = () => {
    const postToUnpublish = _.cloneDeep(currentPost)
    postToUnpublish.frontMatter.unpublish = true
    uploadPost(serializePost(postToUnpublish), postFilename)
  }
}

document.addEventListener('DOMContentLoaded', initEditors)
