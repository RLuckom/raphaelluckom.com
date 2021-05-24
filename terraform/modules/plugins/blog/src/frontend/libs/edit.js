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
      document.getElementById('save-status').innerText = text
    }
    function setPublishedState(text) {
      document.getElementById('publish-status').innerText = text
    }
    const {post: savedPost, savedEditorState, saveState} = loadAutosave(postId)
    if (_.get(savedPost, 'etag') && _.get(savedPost, 'etag') === post.etag) {
      currentPost = savedPost
      initEditorState = savedEditorState
      initSaveState = saveState
    } else {
      currentPost = post
      initSaveState = initSaveState || translatableText.saveState.unmodified
    }
    mainSection.append(...domNodes(
      {
        tagName: 'div',
        id: 'info-toolbar',
        children: [
          {
            tagName: 'div',
            classNames: 'post-info',
            children: [
              {
                tagName: 'div',
                classNames: 'to-index',
                children: [
                  {
                    tagName: 'a',
                    href: './index.html',
                    children: [
                      {
                        tagName: 'svg',
                        width: '1em',
                        height: '2em',
                        viewBox: '0 0 50 100',
                        children: [
                          {
                            tagName: 'polyline',
                            points: [{
                              y: 10,
                              x: 40,
                            },
                            {
                              y: 50,
                              x: 10,
                            }, 
                            {
                              y: 90,
                              x: 40,
                            },
                            ],
                            strokeWidth: '0.4em',
                            stroke: '#000',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                          }
                        ]
                      }
                    ]
                  },
                ]
              },
              {
                tagName: 'div',
                id: 'post-id',
                classNames: 'post-id edit',
                children: [{
                  tagName: 'span',
                  classNames: 'title-post-id',
                  children: [postId],
                }]
              },
              {
                tagName: 'div',
                id: 'post-running-material',
                classNames: 'edit',
                children: [
                  {
                    tagName: 'div',
                    id: 'post-list-header',
                    children: [
                      {
                        tagName: 'div',
                        classNames: 'post-status-headers',
                        children: [
                          {
                            tagName: 'div',
                            classNames: 'save-status-header',
                            children: ["Save Status"]
                          },
                          {
                            tagName: 'div',
                            classNames: 'publish-status-header',
                            children: ["Publish Status"]
                          },
                        ]
                      },
                    ]
                  },
                  {
                    tagName: 'div',
                    classNames: 'post-status edit',
                    children: [
                      {
                        tagName: 'div',
                        id: 'save-status',
                        classNames: 'save-status',
                      },
                      {
                        tagName: 'div',
                        id: 'publish-status',
                        classNames: 'publish-status',
                      },
                    ]
                  },
                ]
              },
            ]
          },
        ]
      },
      {
        tagName: 'input',
        type: 'text',
        name: 'title',
        classNames: 'authoring-input',
        placeholder: translatableText.postMetadata.placeholders.title,
        value: currentPost.frontMatter.title,
        id: 'title',
        onChange: (e) => updatePost({title: e.target.value})
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
            tagName: 'div',
            classNames: 'button-container',
            children: [
              {
                tagName: 'button',
                name: 'save',
                classNames: 'save',
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
                classNames: 'publish',
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
                classNames: 'unpublish',
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
              }
            ]
          },
        ]
      },
      {
        tagName: 'input',
        placeholder: translatableText.postMetadata.placeholders.trails,
        type: 'text',
        name: 'trails',
        classNames: 'authoring-input',
        id: 'trails',
        value: (_.get(post, 'frontMatter.meta.trails') || []).join(', '),
        onChange: (e) => updatePost({trails: _.map((e.target.value || '').split(','), _.trim)})
      },
      {
        tagName: 'div',
        id: 'error',
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
