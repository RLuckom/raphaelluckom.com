function makePostItemList(postRecords, connectionItems) {
  const sortedPostRecords = _.sortBy(postRecords, (rec) => {
    return rec.modifiedTime
  })
  const sortedConnectionItems = _.sortBy(connectionItems, (it) => {
    return it.modifiedTime
  })
  const items = []
  let nextPost = sortedPostRecords.pop()
  let nextItem = sortedConnectionItems.pop()
  while (nextPost || nextItem) {
    if (nextPost) {
      if (nextItem) {
        if (nextItem.modifiedTime > nextPost.modifiedTime) {
          items.push(makeItemElement(nextItem))
          nextItem = sortedConnectionItems.pop()
        } else {
          items.push(makePostRecordElement(nextPost))
          nextPost = sortedPostRecords.pop()
        }
      } else {
        items.push(makePostRecordElement(nextPost))
        nextPost = sortedPostRecords.pop()
      }
    } else {
      items.push(makeItemElement(nextItem))
      nextItem = sortedConnectionItems.pop()
    }
  }
  return items
}

function makePostRecordElement(el) {
  return domNode({
    tagName: 'div',
    children: [{
      tagName: 'h3',
      children: ['post']
    },
    {
      tagName: 'div',
      classNames: ['post-item'],
      children: [
        {
          tagName: 'div',
          classNames: ['connection-item-source'],
          children: [`${JSON.stringify(el)}`],
        },
        {
          tagName: 'div',
          classNames: ['item-modified-date'],
          children: [`${new Date(el.modifiedTime).toISOString()}`],
        }
      ]
    }]
  })
}

function makeItemElement(el) {
  return domNode({
    tagName: 'div',
    children: [{
      tagName: 'h3',
      children: ['item']
    },
    {
      tagName: 'div',
      classNames: ['connection-item'],
      children: [
        {
          tagName: 'div',
          classNames: ['connection-item-source'],
          children: [`${JSON.stringify(el)}`],
        },
        {
          tagName: 'div',
          classNames: ['item-modified-date'],
          children: [`${new Date(el.modifiedTime).toISOString()}`],
        }
      ]
    }]
  })
}

window.RENDER_CONFIG = {
  init: ({listPosts, postRecords, connectionItems}) => {
    console.log(listPosts)
    console.log(postRecords)
    console.log(connectionItems)
    const mainSection = document.querySelector('main')
    mainSection.appendChild(domNode({
      tagName: 'div',
      id: 'post-list'
    }))
    window.addEventListener('pageshow', () => {
      goph.report(['listPosts', 'postRecords'], (e, {listPosts, postRecords}) => {
        updatePostKeys(listPosts, postRecords)
      })
    })
    function postKeyToId(k) {
      const postIdParts = k.split('/').pop().split('.')
      postIdParts.pop()
      const postId = postIdParts.join('.')
      return postId
    }
    function updatePostKeys(listPosts, postRecords) {
      let postKeys = _.map(listPosts, 'Key')
      postRecords = _.sortBy(postRecords.postRecords, 'frontMatter.createDate')
      postKeys = _.reverse(_.sortBy(
        postKeys,
        (k) => _.findIndex(postRecords, (rec) => postKeyToId(k) === rec.id)
      ))
      document.getElementById('post-list').replaceChildren(..._.map(postKeys, (Key) => {
        const postIdParts = Key.split('/').pop().split('.')
        postIdParts.pop()
        const postId = postIdParts.join('.')
        let saveState = getPostSaveState(postId)
        let publishState = getPostPublishState(postId)
        const record = _.find(postRecords, (rec) => postId === rec.id)
        const saved = _.find(listPosts, ({Key}) => postKeyToId(Key) === postId)
        return domNode({
          tagName: 'div',
          classNames: 'post-list-entry',
          children: [
            {
              tagName: 'div',
              id: 'post-running-material',
              children: [
                {
                  tagName: 'div',
                  classNames: 'post-status',
                  children: [
                    {
                      tagName: 'div',
                      classNames: 'post-id',
                      children: [postId]
                    },
                    {
                      tagName: 'div',
                      classNames: 'save-status',
                      children: record ? [new Date(record.frontMatter.createDate).toLocaleString()] : []
                    },
                  ]
                },
              ]
            },
            {
              tagName: 'div',
              classNames: 'post-actions',
              children: [
                {
                  tagName: 'button',
                  name: 'edit',
                  classNames: 'edit',
                  innerText: I18N_CONFIG.postActions.edit,
                  onClick: () => {
                      window.location.href = `./edit.html?postId=${postId}`
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
                    goph.report(['saveAndPublishPostWithoutInput', 'confirmPostPublished'], {postId}, (e, r) => {
                      if (e) {
                        console.log(e)
                        return
                      }
                      const changedETag = _.get(r, 'saveAndPublishPostWithoutInput[0].ETag')
                      if (changedETag) {
                        setPostPublishState(postId, {etag: changedETag, label: I18N_CONFIG.publishState.mostRecent})
                        setPostSaveState(postId, {etag: changedETag, label: I18N_CONFIG.saveState.unmodified})
                      }
                      evt.target.closest('.post-list-entry').querySelector('.save-status').innerText = I18N_CONFIG.saveState.unmodified
                      evt.target.closest('.post-list-entry').querySelector('.publish-status').innerText = I18N_CONFIG.publishState.mostRecent
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
                    goph.report(['unpublishPostWithoutInput', 'confirmPostUnpublished'], {postId}, (e, r) => {
                      if (e) {
                        console.log(e)
                        return
                      }
                      const changedETag = _.get(r, 'unPublishPostWithoutInput[0].ETag')
                      if (changedETag) {
                        setPostPublishState(postId, {etag: changedETag, label: I18N_CONFIG.publishState.mostRecent})
                        setPostSaveState(postId, {etag: changedETag, label: I18N_CONFIG.saveState.unmodified})
                      }
                      evt.target.closest('.post-list-entry').querySelector('.save-status').innerText = I18N_CONFIG.saveState.unmodified
                      evt.target.closest('.post-list-entry').querySelector('.publish-status').innerText = I18N_CONFIG.publishState.unpublished
                      stopSpin()
                    })
                  },
                },
                {
                  tagName: 'button',
                  name: 'delete',
                  classNames: 'delete',
                  spin: true,
                  dataset: {
                    postId
                  },
                  innerText: I18N_CONFIG.postActions.delete,
                  onClick: function(evt, stopSpin) {
                    evt.stopPropagation()
                    goph.report(['deletePostWithoutInput', 'confirmPostDeleted'], {postId}, (e, r) => {
                      if (e) {
                        console.log(e)
                        return
                      }
                      const entry = evt.target.closest('.post-list-entry')
                      if (entry && !e) {
                        entry.remove()
                      }
                      deleteLocalState(postId)
                      stopSpin()
                    })
                  },
                },
              ]
            },
          ]
        })
      }))
    }
    updatePostKeys(listPosts, postRecords)

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
          classNames: 'connection-items-list',
          children: makePostItemList(postRecords, connectionItems)
        },
        {
          tagName: 'div',
          id: 'error',
        }
      ]
    }))
    function buildEditor() {

      document.getElementById('post-editor').innerHTML = ""

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
    }
    buildEditor()
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
      formatter: ({postRecords}) => {
        return postRecords
      }
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
