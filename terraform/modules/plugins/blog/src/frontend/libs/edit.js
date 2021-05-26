window.RENDER_CONFIG = {
  init: ({post, publishedETag}, gopher) => {
    const postId = new URLSearchParams(window.location.search).get('postId').replace(/\//g, '-')
    let publishedState = getPostPublishState(postId)
    if (publishedETag && publishedETag !== _.get(publishedState, 'etag')) {
      if (publishedETag === _.get(post, 'etag')) {
        publishedState = setPostPublishState(postId, {etag: publishedETag, label: translatableText.publishState.mostRecent})
      } else {
        publishedState = setPostPublishState(postId, {etag: publishedETag, label: translatableText.publishState.modified})
      }
    } else if (!publishedETag) {
        publishedState = setPostPublishState(postId, {etag: null, label: translatableText.publishState.unpublished})
    } 
    let saveState = getPostSaveState(postId)
    let editorState = getPostEditorState(postId)
    if (!editorState || _.get(editorState, 'editingETag') !== _.get(post, 'etag')) {
      if (!post) {
        editorState = setPostEditorState(postId, {
          title: '',
          trails: [],
          content: '',
          imageIds: []
        })
        saveState = setPostSaveState(postId, {etag: null, label: translatableText.saveState.unsaved})
      } else {
        editorState = setPostEditorState(postId, {
          title: post.frontMatter.title,
          trails: post.frontMatter.meta.trails,
          content: post.content,
          imageIds: post.frontMatter.meta.imageIds,
          editingETag: post.etag,
        })
        saveState = setPostSaveState(postId, {etag: post.etag, label: translatableText.saveState.unmodified})
      }
    }
    const mainSection = document.querySelector('main')
    function mergeEditorStateToPost() {
      return latestKnownPostState(postId)
    }
      
    function setSaveState(text) {
      document.getElementById('save-status').innerText = text
    }
    function setPublishState(text) {
      document.getElementById('publish-status').innerText = text
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
                            fill: 'transparent',
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
        value: editorState.title,
        id: 'title',
        onChange: (e) => updateEditorState({title: e.target.value})
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
                spin: true,
                innerText: translatableText.postActions.save,
                onClick: function(evt, stopSpin) {
                  evt.stopPropagation()
                  const postToSave = mergeEditorStateToPost()
                  goph.report('savePostWithoutPublishing', {post: postToSave, postId}, (e, r) => {
                    const changedETag = _.get(r, 'savePostWithoutPublishing[0].ETag')
                    if (changedETag) {
                      postToSave.etag = changedETag
                      updateEditorState({editingETag: changedETag})
                      setPostAsSaved(postId, postToSave)
                      setPostSaveState(postId, {etag: changedETag, label: translatableText.saveState.unmodified})
                    }
                    if (postToSave.etag !== getPostPublishState.etag) {
                      updatePostPublishState({label: translatableText.publishState.modified})
                      setPublishState(translatableText.publishState.modified)
                    }
                    setSaveState(translatableText.saveState.unmodified)
                    stopSpin()
                  })
                }
              },
              {
                tagName: 'button',
                name: 'publish',
                classNames: 'publish',
                spin: true,
                innerText: translatableText.postActions.publish,
                onClick: function(evt, stopSpin) {
                  evt.stopPropagation()
                  const postToSave = mergeEditorStateToPost()
                  goph.report(['saveAndPublishPost', 'confirmPostPublished'], {post: postToSave, postId}, (e, r) => {
                    if (e) {
                      console.error(e)
                      return
                    }
                    const changedETag = _.get(r, 'saveAndPublishPost[0].ETag')
                    if (changedETag) {
                      postToSave.etag = changedETag
                      updateEditorState({editingETag: changedETag})
                      setPostAsSaved(postId, postToSave)
                      setPostPublishState(postId, {etag: changedETag, label: translatableText.publishState.mostRecent})
                      setPostSaveState(postId, {etag: changedETag, label: translatableText.saveState.unmodified})
                    }
                    setSaveState(translatableText.saveState.unmodified)
                    setPublishState(translatableText.publishState.mostRecent)
                    stopSpin()
                  })
                }
              },
              {
                tagName: 'button',
                name: 'unpublish',
                classNames: 'unpublish',
                spin: true,
                innerText: translatableText.postActions.unpublish,
                onClick: function(evt, stopSpin) {
                  evt.stopPropagation()
                  const postToSave = mergeEditorStateToPost()
                  goph.report(['unpublishPost', 'confirmPostUnpublished'], {post: postToSave, postId}, (e, r) => {
                    if (e) {
                      console.error(e)
                      return
                    }
                    const changedETag = _.get(r, 'unpublishPost[0].ETag')
                    if (changedETag) {
                      postToSave.etag = changedETag
                      updateEditorState({editingETag: changedETag})
                      setPostAsSaved(postId, postToSave)
                      setPostPublishState(postId, {etag: null, label: translatableText.publishState.unpublished})
                    }
                    setSaveState(translatableText.saveState.unmodified)
                    setPublishState(translatableText.publishState.unpublished)
                    stopSpin()
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
        onChange: (e) => updateEditorState({trails: _.map((e.target.value || '').split(','), _.trim)})
      },
      {
        tagName: 'div',
        id: 'error',
      }))
      setSaveState(saveState.label)
      setPublishState(publishedState.label)

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

      function updateEditorState(updates) {
        const postAsSaved = getPostAsSaved(postId)
        let isModified = false
        if (updates.title && !_.isEqual(updates.title, _.get(postAsSaved, 'frontMatter.title'))) {
          isModified = true
        }
        if (updates.imageIds && !_.isEqual(updates.imageIds, _.get(postAsSaved, 'frontMatter.meta.imageIds'))) {
          isModified = true
        }
        if (updates.trails && !_.isEqual(updates.trails, _.get(postAsSaved, 'frontMatter.meta.trails'))) {
          isModified = true
        }
        if (updates.content && !_.isEqual(updates.content, _.get(postAsSaved, 'content'))) {
          isModified = true
        }
        editorState = updatePostEditorState(postId, updates)
        const s = updatePostSaveState(postId, {label: isModified ? translatableText.saveState.modified : translatableText.saveState.unmodified})
        setSaveState(s.label)
      }

      const postIdInLinkRegex = new RegExp("\\((https:\/\/.*)" + postId + '([^\\)]*)\\)', 'g')
      const postIdInRelativeLinkRegex = new RegExp("]\\(/(.*)" + postId + '([^\\)]*)\\)', 'g')
      const postContentForProsemirror = editorState.content.replace(postIdInLinkRegex, (match, g1, g2) => "(" + g1 + encodeURIComponent(postId) + g2 + ')').replace(
        postIdInRelativeLinkRegex, (match, g1, g2) => "](/" + g1 + encodeURIComponent(postId) + g2 + ')')
        prosemirrorView(document.getElementById('post-editor'), uploadImage, _.debounce(_.partial(updateEditorState), 2000), editorState.editorState, postContentForProsemirror, editorState.imageIds)
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
