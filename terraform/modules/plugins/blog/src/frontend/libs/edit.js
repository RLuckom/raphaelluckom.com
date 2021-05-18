
window.RENDER_CONFIG = {
  init: ({post, publishedETag}, gopher) => {
    let postAsSaved = _.cloneDeep(post)
    let currentPublishedETag = publishedETag
    let initSaveState
    if (!post) {
      post = newPost()
      initSaveState = translatableText.saveState.unsaved
    }
    let currentSavedETag = _.get(post, 'etag')
    let currentPost
    const postId = new URLSearchParams(window.location.search).get('postId').replace(/\//g, '-')
    let initEditorState
    let initPublishedState = currentPublishedETag ? currentPublishedETag === currentSavedETag ? translatableText.publishState.mostRecent : translatableText.publishState.modified : translatableText.publishState.unpublished
    const mainSection = document.querySelector('main')
    function setSaveState(text) {
      document.getElementById('post-state').innerText = text
    }
    function setPublishedState(text) {
      document.getElementById('post-publish-state').innerText = text
    }
    const {savedPost, savedEditorState, saveState} = loadAutosave(postId)
    if (_.get(savedPost, 'etag') && _.get(savedPost, 'etag') === post.etag) {
      currentPost = savedPost
      initEditorState = savedEditorState
      initSaveState = saveState
    } else {
      currentPost = post
      initSaveState = initSaveState || translatableText.saveState.unmodified
    }
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
              onChange: (e) => updatePost({title: e.target.value})
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
              onChange: (e) => updatePost({author: e.target.value})
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
              onChange: (e) => updatePost({trails: _.map((e.target.value || '').split(','), _.trim)})
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
              onClick: function() {
                goph.report('savePostWithoutPublishing', {post: currentPost, postId}, (e, r) => {
                  const changedEtag = _.get(r, 'savePostWithoutPublishing[0].ETag')
                  if (changedEtag) {
                    currentSavedETag = changedEtag
                    currentPost.etag = changedEtag
                    postAsSaved = _.cloneDeep(currentPost)
                  }
                  console.log('saved')
                  updatePost({})
                })
              }
            },
            {
              tagName: 'button',
              name: 'publish',
              id: 'publish',
              innerText: translatableText.postActions.publish,
              onClick: function() {
                goph.report(['saveAndPublishPost', 'confirmPostPublished'], {post: currentPost, postId}, (e, r) => {
                  if (e) {
                    console.error(e)
                    return
                  }
                  console.log('published')
                  const changedEtag = _.get(r, 'saveAndPublishPost[0].ETag')
                  if (changedEtag) {
                    currentSavedETag = changedEtag
                    currentPost.etag = changedEtag
                    currentPublishedETag = changedEtag
                    postAsSaved = _.cloneDeep(currentPost)
                  }
                  updatePost({})
                })
              }
            },
            {
              tagName: 'button',
              name: 'unpublish',
              id: 'unpublish',
              innerText: translatableText.postActions.unpublish,
              onClick: function() {
                goph.report(['unpublishPost', 'confirmPostUnpublished'], {post: currentPost, postId}, (e, r) => {
                  if (e) {
                    console.error(e)
                    return
                  }
                  console.log('unpublished')
                  const changedEtag = _.get(r, 'unpublishPost[0].ETag')
                  if (changedEtag) {
                    currentSavedETag = changedEtag
                    currentPost.etag = changedEtag
                    currentPublishedETag = null
                    postAsSaved = _.cloneDeep(currentPost)
                  }
                  updatePost({})
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

    function updatePost({title, author, trails, editorState, imageIds, content}) {
      const {post, saveState, publishState} = autosave({postId, currentEditorState, postAsSaved, currentSavedETag, currentPublishedETag, currentPost}, {title, author, trails, editorState, imageIds, content})
      setSaveState(saveState)
      setPublishedState(publishState)
      currentPost = post
    }

    let currentEditorState

    const postIdInLinkRegex = new RegExp("\\((https:\/\/.*)" + postId + '([^\\)]*)\\)', 'g')
    const postIdInRelativeLinkRegex = new RegExp("]\\(/(.*)" + postId + '([^\\)]*)\\)', 'g')
    const postContentForProsemirror = currentPost.content.replace(postIdInLinkRegex, (match, g1, g2) => "(" + g1 + encodeURIComponent(postId) + g2 + ')').replace(
    postIdInRelativeLinkRegex, (match, g1, g2) => "](/" + g1 + encodeURIComponent(postId) + g2 + ')')
    prosemirrorView(document.getElementById('post-editor'), uploadImage, _.debounce(updatePost, 2000), initEditorState, postContentForProsemirror, _.get(currentPost, 'frontMatter.meta.imageIds'))
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
