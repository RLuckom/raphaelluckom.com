window.RENDER_CONFIG = {
  init: ({postKeys}, gopher) => {
    const mainSection = document.querySelector('main')
    const closeInputButtonText = 'Close input'
    window.addEventListener('pageshow', () => {
      goph.report('listPosts', (e, {listPosts}) => {
        const postKeys = _.map(listPosts[0], 'Key')
        updatePostKeys(postKeys)
      })
    })
    const slashReplacement = '-'

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
                if (innerText === translatableText.postActions.new) {
                  document.getElementById('new-post-button').innerText = closeInputButtonText
                } else {
                  document.getElementById('new-post-button').innerText = translatableText.postActions.new
                }
              },
              innerText: translatableText.postActions.new,
            },
            {
              tagName: 'input',
              type: 'text',
              id: 'new-post',
              classNames: ['new-post'],
              placeholder: translatableText.postMetadata.placeholders.id,
              onKeyDown: (evt) => {
                if (evt.which === 13 && evt.target.value) {
                  window.location.href = `./edit.html?postId=${evt.target.value.replace(/\//g, slashReplacement)}`
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
        const postIdParts = Key.split('/').pop().split('.')
        postIdParts.pop()
        const postId = postIdParts.join('.')
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
                children: [
                translatableText.postActions.edit,
              ],
            },
            {
              tagName: 'button',
              name: 'publish',
              id: 'publish',
              innerText: translatableText.postActions.publish,
              onClick: () => {
                goph.report(['saveAndPublishPostWithoutInput', 'confirmPostPublished'], {postId}, (e, r) => {
                  if (e) {
                    console.log(e)
                    return
                  }
                  console.log('published')
                })
              }
            },
            {
              tagName: 'button',
              name: 'unpublish',
              id: 'unpublish',
              innerText: translatableText.postActions.unpublish,
              onClick: () => {
                goph.report(['unpublishPostWithoutInput', 'confirmPostUnpublished'], {postId}, (e, r) => {
                  if (e) {
                    console.log(e)
                    return
                  }
                  console.log('unpublished')
                })
              },
            },
            {
              tagName: 'button',
              name: 'delete',
              id: 'delete',
              dataset: {
                postId
              },
              innerText: translatableText.postActions.delete,
              onClick: (evt) => {
                goph.report(['deletePostWithoutInput', 'confirmPostDeleted'], {postId}, (e, r) => {
                  if (e) {
                    console.log(e)
                    return
                  }
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
