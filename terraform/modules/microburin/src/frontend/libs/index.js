window.RENDER_CONFIG = {
  init: ({connectionItems}) => {
    console.log(connectionItems)
    const mainSection = document.querySelector('main')
    const postId = "null/test"
    let editorState = getSocialEditorState()
    if (!editorState) {
      editorState = setSocialEditorState({
        title: postId,
        trails: [],
        content: '',
        imageIds: [],
        footnotes: {},
      })
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
      const latestEditorState = getPostEditorState(postId)
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
  },
  onAPIError: (e, r, cb) => {
    console.error(e)
    if (_.isString(_.get(e, 'message')) && e.message.indexOf('401') !== -1) {
      location.reload()
    }
    return cb(e, r)
  },
}
