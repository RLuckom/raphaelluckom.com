let currentPost
const postId = new URLSearchParams(window.location.search).get('postId')
const postDataKey = `postData?postId=${postId}`

// https://gist.github.com/mbrehin/05c0d41a7e50eef7f95711e237502c85
// script to replace <textarea> elements in forms with prosemirror editors 
// ( if they have the .prosemirror class ) 
function initEditors() {
  const savedData = localStorage.getItem(postDataKey)
  let initEditorState
  if (savedData) {
    const parsed = JSON.parse(savedData)
    currentPost = parsed.currentPost
    initEditorState = parsed.editorState
  }

  function uploadImage(buffer, ext, callback) {
    const imageId = uuid.v4()
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
  }, 2000)

  function onChange({imageIds, postContent, state}) {
    const titleInput = document.querySelector('#title').value
    postId = titleInput.replace(/[. ]/g, "_")
    document.getElementById('post-id').innerText = postId
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

  function uploadPost(post, postId) {
    const postKey = getPostUploadKey(postId)
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
    goph.report('savePostWithoutPublishing', {post: currentPost, postId})
  }
  document.getElementById('publish').onclick = () => {
    goph.report('saveAndPublishPost', {post: currentPost, postId})
  }
  document.getElementById('unpublish').onclick = () => {
    goph.report('unpublishPost', {post: currentPost, postId})
  }
}

document.addEventListener('DOMContentLoaded', initEditors)
