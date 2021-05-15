window.RENDER_CONFIG = {
  init: ({postKeys}, gopher) => {
    const mainSection = document.querySelector('main')
    const writePostButtonText = 'Write new post'
    const closeInputButtonText = 'Close input'
    function expectChange(change) {
      setTimeout(() => {
        goph.report('listPosts', (e, {listPosts}) => {
          const postKeys = _.map(listPosts[0], 'Key')
          updatePostKeys(postKeys)
        })
      }, 500)
    }
    mainSection.appendChild(domNode({
      tagName: 'div',
      children: [
        {
          tagName: 'div',
          id: 'post-list-header',
          children: [
            {
              tagName: 'button',
              id: 'new-post-button',
              onClick: () => {
                document.getElementById('new-post').classList.toggle('expanded')
                const innerText = document.getElementById('new-post-button').innerText
                if (innerText === writePostButtonText) {
                  document.getElementById('new-post-button').innerText = closeInputButtonText
                } else {
                  document.getElementById('new-post-button').innerText = writePostButtonText
                }
              },
              innerText: writePostButtonText,
            },
            {
              tagName: 'input',
              type: 'text',
              id: 'new-post',
              classNames: ['new-post'],
              placeholder: 'enter a new post id, then press Enter',
              onKeyDown: (evt) => {
                if (evt.which === 13 && evt.target.value) {
                  window.location.href = `./edit.html?postId=${encodeURIComponent(evt.target.value)}`
                }
              }
            },
          ]
        },
        {
          tagName: 'div',
          id: 'post-list'
        }
      ]
    }))
    function updatePostKeys(postKeys) {
        document.getElementById('post-list').replaceChildren(..._.map(postKeys, (Key) => {
        const postId = Key.split('/').pop().split('.')[0]
        return domNode({
          tagName: 'div',
          classNames: 'post-list-entry',
          children: [
            {
              tagName: 'div',
              classNames: 'post-name',
              children: [postId]
            },
            {
              tagName: 'a',
              classNames: 'post-edit',
              href: `/${CONFIG.plugin_root}edit.html?postId=${postId}`,
                children: ["Edit Post"],
            },
            {
              tagName: 'button',
              name: 'publish',
              id: 'publish',
              innerText: 'Publish to Blog',
              onClick: () => {
                goph.report('saveAndPublishPostWithoutInput', {postId}, _.noop)
              }
            },
            {
              tagName: 'button',
              name: 'unpublish',
              id: 'unpublish',
              innerText: 'Remove from Blog',
              onClick: () => {
                goph.report('unpublishPostWithoutInput', {postId}, _.noop)
              },
            },
            {
              tagName: 'button',
              name: 'delete',
              id: 'delete',
              dataset: {
                postId
              },
              innerText: 'Delete Post',
              onClick: (evt) => {
                goph.report('deletePostWithoutInput', {postId}, (e, r) => {
                  const entry = evt.target.closest('.post-list-entry')
                  if (entry && !e) {
                    entry.remove()
                  }
                })
              },
            },
          ]
        })
      }))
    }
    updatePostKeys(postKeys)
  },
  params: {
    postKeys: {
      source: 'listPosts',
      formatter: ({listPosts}) => {
        return _.map(listPosts[0], 'Key')
      }
    }
  },
}
