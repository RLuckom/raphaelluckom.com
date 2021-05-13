window.RENDER_CONFIG = {
  init: ({post}, gopher) => {
    if (!post) {
      post = newPost()
    }
    let currentEtag = _.get(post, 'etag')
    let currentPost
    const postId = new URLSearchParams(window.location.search).get('postId')
    const postDataKey = `postData?postId=${postId}`
    const savedData = localStorage.getItem(postDataKey)
    let parsedSavedData
    if (savedData) {
      try {
        parsedSavedData = JSON.parse(savedData)
      } catch(e) {
        console.error(e)
      }
    }
    let initEditorState
    if (_.get(parsedSavedData, 'currentPost.etag') === post.etag) {
        currentPost = parsedSavedData.currentPost
        initEditorState = parsedSavedData.editorState
    } else {
      currentPost = post
    }
    const mainSection = document.querySelector('main')
    mainSection.appendChild(domNode({
      tagName: 'div',
      children: [
        {
          tagName: 'label',
          isFor: 'title',
          children: [
            'Title:',
            {
              tagName: 'span',
              id: 'post-id',
            },
            {
              tagName: 'input',
              type: 'text',
              name: 'title',
              value: post.frontMatter.title,
              id: 'title',
            }
          ]
        },
        {
          tagName: 'label',
          isFor: 'author',
          children: [
            'Author:',
            {
              tagName: 'input',
              type: 'text',
              name: 'author',
              id: 'author',
              value: CONFIG.operator_name
            }
          ]
        },
        {
          tagName: 'label',
          isFor: 'trails',
          children: [
            'Trails (comma-separated):',
            {
              tagName: 'input',
              type: 'text',
              name: 'trails',
              id: 'trails',
              value: (_.get(post, 'frontMatter.meta.trails') || []).join(', '),
            }
          ]
        },
        {
          tagName: 'label',
          isFor: 'main',
          children: [
            'Write the post:',
            {
              tagName: 'textarea',
              classNames: ['prosemirror', 'editor'],
              name: 'main',
              id: 'text',
            }
          ]
        },
        {
          tagName: 'button',
          name: 'save',
          id: 'save',
          innerText: 'Save Without Publishing',
          onClick: () => {
            goph.report('savePostWithoutPublishing', {post: currentPost, postId}, (e, r) => {
              const changedEtag = _.get(r, 'savePostWithoutPublishing[0].ETag')
              if (changedEtag) {
                currentEtag = changedEtag
              }
            })
          }
        },
        {
          tagName: 'button',
          name: 'publish',
          id: 'publish',
          innerText: 'Publish to Blog',
          onClick: () => {
            goph.report('saveAndPublishPost', {post: currentPost, postId}, (e, r) => {
              const changedEtag = _.get(r, 'saveAndPublishPost[0].ETag')
              if (changedEtag) {
                currentEtag = changedEtag
              }
            })
          }
        },
        {
          tagName: 'button',
          name: 'unpublish',
          id: 'unpublish',
          innerText: 'Remove from Blog',
          onClick: () => {
            goph.report('unpublishPost', {post: currentPost, postId}, (e, r) => {
              const changedEtag = _.get(r, 'unpublishPost[0].ETag')
              if (changedEtag) {
                currentEtag = changedEtag
              }
            })
          },
        },
        {
          tagName: 'div',
          id: 'error',
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
          imageExt: ext,
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

    const autosave = _.debounce((currentPost, state) => {
      localStorage.setItem(postDataKey, JSON.stringify({
        currentPost, postId, editorState: state,
      }))
    }, 1000)

    function onChange({imageIds, content, state}) {
      const titleInput = document.querySelector('#title').value
      document.getElementById('post-id').innerText = postId
      currentPost = constructPost({
        etag: currentEtag,
        imageIds,
        content,
        createDate: _.get(currentPost, 'createDate') || new Date().toISOString(),
        title: document.querySelector('#title').value,
        author: document.querySelector('#author').value,
        trails: _.map(document.querySelector('#trails').value.split(","), _.trim),
      })
      autosave(currentPost, state)
    }

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
      const { view, plugins } = prosemirrorView(area, container, uploadImage, onChange, initEditorState, currentPost.content)
    }
  },
  params: {
    post: {
      source: 'getPost',
      formatter: ({getPost}) => {
        return getPost
      }
    }
  },
  inputs: {
    postId: new URLSearchParams(window.location.search).get('postId')
  }
}
