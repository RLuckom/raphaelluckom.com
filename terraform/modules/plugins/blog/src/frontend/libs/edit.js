const translatableText = {
  postMetadata: {
    placeholders: {
      trails: 'Trails (comma-separated)',
      author: 'Author',
      title: 'Title',
    }
  },
  saveState: {
    unmodified: 'Unmodified',
    modified: 'Changed locally',
  },
  publishState: {
    mostRecent: 'Published matches most recent saved version',
    unpublished: 'Unpublished',
    modified: 'Saved version differs from published version'
  },
  postActions: {
    unpublish: 'Remove from Blog',
    publish: 'Publish to Blog',
    save: 'Save Without Publishing',
  },
  editing: 'Editing',
}

window.RENDER_CONFIG = {
  init: ({post, publishedETag}, gopher) => {
    let postAsSaved = _.cloneDeep(post)
    let currentPublishedETag = publishedETag
    if (!post) {
      post = newPost()
    }
    let currentEtag = _.get(post, 'etag')
    let currentPost
    const postId = new URLSearchParams(window.location.search).get('postId').replace(/\//g, '-')
    const postDataKey = `postData?postId=${postId}`
    let initEditorState
    let initSaveState
    let initPublishedState = currentPublishedETag ? currentPublishedETag === currentEtag ? translatableText.publishState.mostRecent : translatableText.publishState.modified : translatableText.publishState.unpublished
    function loadAutosaveIfModified() {
      const savedData = localStorage.getItem(postDataKey)
      let parsedSavedData
      if (savedData) {
        try {
          parsedSavedData = JSON.parse(savedData)
        } catch(e) {
          console.error(e)
        }
      }
      if (_.get(parsedSavedData, 'currentPost.etag') === post.etag) {
        currentPost = parsedSavedData.currentPost
        initEditorState = parsedSavedData.editorState
        if (!postsEqual(currentPost, post)) {
          initSaveState = translatableText.saveState.modified
        } else {
          initSaveState = translatableText.saveState.unmodified
        }
      } else {
        currentPost = post
        initSaveState = translatableText.saveState.modified
      }
    }
    const mainSection = document.querySelector('main')
    function setSaveState(text) {
      document.getElementById('post-state').innerText = text
    }
    function setPublishedState(text) {
      document.getElementById('post-publish-state').innerText = text
    }
    loadAutosaveIfModified()
    mainSection.appendChild(domNode({
      tagName: 'div',
      children: [
        {
          tagName: 'div',
          id: 'post-id',
          children: [
            translatableText.editing + ' ',
            {
              tagName: 'a',
              href: `/${CONFIG.plugin_post_hosting_path}${postId}.md`,
              children: [`${postId}.md`],
            }
          ]
        },
        {
          tagName: 'div',
          id: 'post-state',
        },
        {
          tagName: 'div',
          id: 'post-publish-state',
        },
        {
          tagName: 'div',
          children: [
            {
              tagName: 'input',
              type: 'text',
              name: 'title',
              placeholder: translatableText.postMetadata.placeholders.title,
              value: currentPost.frontMatter.title,
              id: 'title',
              onChange: (e) => autosave({title: e.target.value})
            }
          ]
        },
        {
          tagName: 'div',
          children: [
            {
              tagName: 'input',
              type: 'text',
              placeholder: translatableText.postMetadata.placeholders.author,
              id: 'author',
              value: CONFIG.operator_name,
              onChange: (e) => autosave({author: e.target.value})
            }
          ]
        },
        {
          tagName: 'div',
          children: [
            {
              tagName: 'input',
              placeholder: translatableText.postMetadata.placeholders.trails,
              type: 'text',
              name: 'trails',
              id: 'trails',
              value: (_.get(post, 'frontMatter.meta.trails') || []).join(', '),
              onChange: (e) => autosave({trails: _.map((e.target.value || '').split(','), _.trim)})
            }
          ]
        },
        {
          tagName: 'div',
          id: 'post-editor',
          classNames: ['prosemirror', 'editor'],
          name: 'main',
        },
        {
          tagName: 'div',
          id: 'post-actions',
          children: [
            {
              tagName: 'button',
              name: 'save',
              id: 'save',
              innerText: translatableText.postActions.save,
              onClick: () => {
                goph.report('savePostWithoutPublishing', {post: currentPost, postId}, (e, r) => {
                  const changedEtag = _.get(r, 'savePostWithoutPublishing[0].ETag')
                  if (changedEtag) {
                    currentEtag = changedEtag
                    currentPost.etag = changedEtag
                    postAsSaved = _.cloneDeep(currentPost)
                  }
                  console.log('saved')
                  autosave({})
                })
              }
            },
            {
              tagName: 'button',
              name: 'publish',
              id: 'publish',
              innerText: translatableText.postActions.publish,
              onClick: () => {
                goph.report(['saveAndPublishPost', 'confirmPostPublished'], {post: currentPost, postId}, (e, r) => {
                  if (e) {
                    console.error(e)
                    return
                  }
                  console.log('published')
                  const changedEtag = _.get(r, 'saveAndPublishPost[0].ETag')
                  if (changedEtag) {
                    currentEtag = changedEtag
                    currentPost.etag = changedEtag
                    currentPublishedETag = changedEtag
                    postAsSaved = _.cloneDeep(currentPost)
                  }
                  autosave({})
                })
              }
            },
            {
              tagName: 'button',
              name: 'unpublish',
              id: 'unpublish',
              innerText: translatableText.postActions.unpublish,
              onClick: () => {
                goph.report(['unpublishPost', 'confirmPostUnpublished'], {post: currentPost, postId}, (e, r) => {
                  if (e) {
                    console.error(e)
                    return
                  }
                  console.log('unpublished')
                  const changedEtag = _.get(r, 'unpublishPost[0].ETag')
                  console.log(r)
                  if (changedEtag) {
                    currentEtag = changedEtag
                    currentPost.etag = changedEtag
                    currentPublishedETag = null
                    postAsSaved = _.cloneDeep(currentPost)
                  }
                  autosave({})
                })
              },
            }]
        },
        {
          tagName: 'div',
          id: 'error',
        },
      ]
    }))
    setSaveState(initSaveState)
    setPublishedState(initPublishedState)

    function uploadImage(buffer, ext, callback) {
      const imageId = uuid.v4()
      const canonicalExt = canonicalImageTypes[_.toLower(ext)]
      const privateImageUrl = getImagePrivateUrl({postId, imageId, ext: canonicalExt, size: 500})
      goph.report(
        'pollImage',
        {
          imageExt: canonicalExt,
          postId: postId,
          imageId: imageId,
          imageSize: 500,
          buffer,
        },
        (e, r) => {
          callback(e, {
            url: privateImageUrl,
            imageId
          })
        }
      )
    }

    let currentEditorState
    function autosave({title, author, trails, editorState, imageIds, content}) {
      currentEditorState = editorState || currentEditorState
      currentPost = constructPost({
        etag: currentEtag || '',
        imageIds: imageIds || currentPost.frontMatter.meta.imageIds || [],
        content: content || currentPost.content || '',
        title: title || currentPost.frontMatter.title || '',
        author: author || currentPost.frontMatter.author || '',
        trails: trails || currentPost.frontMatter.meta.trails || [],
        createDate: currentPost.frontMatter.createDate,
        date: currentPost.frontMatter.date,
        updateDate: currentPost.frontMatter.updateDate,
      })
      localStorage.setItem(postDataKey, JSON.stringify({
        currentPost, postId, currentEditorState,
      }))
      if (!postsEqual(currentPost, postAsSaved)) {
        setSaveState(translatableText.saveState.modified)
      } else {
        setSaveState(translatableText.saveState.unmodified)
      }
      if (currentEtag === currentPublishedETag) {
        setPublishedState(translatableText.publishState.mostRecent)
      } else if (!currentPublishedETag) {
        setPublishedState(translatableText.publishState.unpublished)
      } else {
        setPublishedState(translatableText.publishState.modified)
      }
    }

    const postIdInLinkRegex = new RegExp("\\((https:\/\/.*)" + postId + '([^\\)]*)\\)', 'g')
    const postIdInRelativeLinkRegex = new RegExp("]\\(/(.*)" + postId + '([^\\)]*)\\)', 'g')
    const postContentForProsemirror = currentPost.content.replace(postIdInLinkRegex, (match, g1, g2) => "(" + g1 + encodeURIComponent(postId) + g2 + ')').replace(
    postIdInRelativeLinkRegex, (match, g1, g2) => "](/" + g1 + encodeURIComponent(postId) + g2 + ')')
    prosemirrorView(document.getElementById('post-editor'), uploadImage, _.debounce(autosave, 2000), initEditorState, postContentForProsemirror, _.get(currentPost, 'frontMatter.meta.imageIds'))
  },
  params: {
    post: {
      source: 'getPost',
      formatter: ({getPost}) => {
        return getPost
      }
    },
    publishedETag: {
      source: 'getPublishedPostETag',
      formatter: ({getPublishedPostETag}) => {
        return getPublishedPostETag
      }
    },
  },
  inputs: {
    postId: new URLSearchParams(window.location.search).get('postId').replace(/\//g, '-'),
  },
  onAPIError: (e, r, cb) => {
    console.error(e)
    if (_.isString(_.get(e, 'message')) && e.message.indexOf('401') !== -1) {
      location.reload()
    }
    return cb(e, r)
  }
}
