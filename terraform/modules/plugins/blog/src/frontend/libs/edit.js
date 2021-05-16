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
          tagName: 'div',
          id: 'post-id',
          children: [
            "Editing ",
            {
              tagName: 'a',
              href: `/${CONFIG.plugin_post_hosting_path}${postId}.md`,
              children: [`${postId}.md`],
            }
          ]
        },
        {
          tagName: 'div',
          children: [
            {
              tagName: 'input',
              type: 'text',
              name: 'title',
              placeholder: 'Title',
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
              placeholder: 'Author',
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
              placeholder: 'Trails (comma-separated)',
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
            goph.report(['saveAndPublishPost', 'confirmPostPublished'], {post: currentPost, postId}, (e, r) => {
              if (e) {
                console.error(e)
                return
              }
              console.log('published')
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
            goph.report(['unpublishPost', 'confirmPostUnpublished'], {post: currentPost, postId}, (e, r) => {
              if (e) {
                console.error(e)
                return
              }
              console.log('unpublished')
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
      })
      localStorage.setItem(postDataKey, JSON.stringify({
        currentPost, postId, currentEditorState,
      }))
    }

    const postContentForProsemirror = currentPost.content.replace(new RegExp("\\((https:\/\/.*)" + postId + '([^\\)]*)\\)', 'g'), (match, g1, g2) => "(" + g1 + encodeURIComponent(postId) + g2 + ')').replace(
      new RegExp("]\\(/(.*)" + postId + '([^\\)]*)\\)', 'g'), (match, g1, g2) => "](/" + g1 + encodeURIComponent(postId) + g2 + ')')
    prosemirrorView(document.getElementById('post-editor'), uploadImage, _.debounce(autosave, 2000), initEditorState, postContentForProsemirror)
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
