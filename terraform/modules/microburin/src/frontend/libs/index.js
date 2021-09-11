window.RENDER_CONFIG = {
  init: ({listPosts, postRecords, connectionItems}) => {
    console.log(listPosts)
    console.log(postRecords)
    console.log(connectionItems)
    const mainSection = document.querySelector('main')
    let editorState = getSocialEditorState()
    if (!editorState) {
      editorState = resetSocialEditorState()
    }
    const postId = editorState.title
    const editorStateOptions = {
      getEditorState: getSocialEditorState,
    }
    function mergeEditorStateToPost() {
      return latestKnownPostState(postId, editorStateOptions)
    }

    mainSection.appendChild(domNode({
      tagName: 'div',
      children: [
        {
          tagName: 'div',
          id: 'microburin-social-nav',
          children: [
            {
              tagName: 'a',
              href: './connections.html',
              children: [
                'Connection list'
              ]
            }
          ]
        },
        {
          tagName: 'div',
          id: 'post-editor',
          classNames: ['prosemirror', 'editor'],
        },
        {
          tagName: 'div',
          id: 'post-footnotes',
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
                  innerText: I18N_CONFIG.postActions.save,
                  onClick: function(evt, stopSpin) {
                    evt.stopPropagation()
                    const postToSave = mergeEditorStateToPost()
                    goph.report('savePostWithoutPublishing', {post: postToSave, postId}, (e, r) => {
                      const changedETag = _.get(r, 'savePostWithoutPublishing[0].ETag')
                      if (changedETag) {
                        postToSave.etag = changedETag
                        updateSocialEditorStateExternal(postId, {etag: changedETag}, updateFootnoteMenu)
                        setPostAsSaved(postId, postToSave)
                        setPostSaveState(postId, {etag: changedETag, label: I18N_CONFIG.saveState.unmodified})
                      }
                      if (postToSave.etag !== getPostPublishState.etag) {
                        updatePostPublishState(postId, {label: I18N_CONFIG.publishState.modified})
                        const changedDate = new Date()
                        //setPublishState(changedDate.toLocaleString())
                      }
                      stopSpin()
                    })
                  }
                },
                {
                  tagName: 'button',
                  name: 'publish',
                  classNames: 'publish',
                  spin: true,
                  innerText: I18N_CONFIG.postActions.publish,
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
                        updateSocialEditorStateExternal(postId, {etag: changedETag}, updateFootnoteMenu)
                        setPostAsSaved(postId, postToSave)
                        //setPostPublishState(postId, {etag: changedETag, label: I18N_CONFIG.publishState.mostRecent})
                        setPostSaveState(postId, {etag: changedETag, label: I18N_CONFIG.saveState.unmodified})
                        editorState = resetSocialEditorState()
                      }
                      const changedDate = new Date()
                      //setPublishState(changedDate.toLocaleString())
                      stopSpin()
                    })
                  }
                },
                {
                  tagName: 'button',
                  name: 'unpublish',
                  classNames: 'unpublish',
                  spin: true,
                  innerText: I18N_CONFIG.postActions.unpublish,
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
                        updateSocialEditorStateExternal(postId, {etag: changedETag}, updateFootnoteMenu)
                        setPostAsSaved(postId, postToSave)
                        //setPostPublishState(postId, {etag: null, label: I18N_CONFIG.publishState.unpublished})
                      }
                      const changedDate = new Date() 
                      //setPublishState(changedDate.toLocaleString())
                      stopSpin()
                    })
                  },
                }
              ]
            },
          ]
        },
        {
          tagName: 'div',
          id: 'error',
        }
      ]
    }))

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

    function addFootnote() {
      const latestEditorState = getSocialEditorState()
      const footnoteNumber = _.keys(latestEditorState.footnotes || {}).length + 1
      document.getElementById('post-footnotes').appendChild(buildFootnoteEditor(postId, footnoteNumber, uploadImage, updateFootnoteMenu))
    }

    const postContentForProsemirror = prepareEditorString(editorState.content, postId)
    const {updateFootnoteMenu} = prosemirrorView({
      container: document.getElementById('post-editor'),
      uploadImage, 
      onChange: _.partialRight(_.partial(updateSocialEditorStateExternal, postId)),
      initialState: editorState.editorState,
      initialMarkdownText: postContentForProsemirror,
      footnotes: editorState.footnotes || {},
      addFootnote,
      postId: postId
    })
    const latestEditorState = getSocialEditorState()
    _.each(latestEditorState.footnotes, (v, k) => {
      document.getElementById('post-footnotes').appendChild(buildFootnoteEditor(postId, k, uploadImage, updateFootnoteMenu))
    })
  },
  params: {
    connectionItems: {
      source: 'connectionItems',
      formatter: ({connectionItems}) => {
        return connectionItems
      }
    },
    listPosts: {
      source: 'listPosts',
      formatter: ({listPosts}) => {
        return listPosts
      }
    },
    postRecords: {
      source: 'postRecords',
    },
  },
  onAPIError: (e, r, cb) => {
    console.error(e)
    if (_.isString(_.get(e, 'message')) && e.message.indexOf('401') !== -1) {
      location.reload()
    }
    return cb(e, r)
  },
}
