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
          tagName: 'table',
          id: 'post-table',
          children: [
            {
              tagName: 'col',
              classNames: ["postIdCol"]
            },
            {
              tagName: 'colgroup',
              classNames: 'post-status',
              children: [
                {
                  tagName: 'col',
                  classNames: ['save-status']
                },
                {
                  tagName: 'col',
                  classNames: ['publish-status']
                },
              ]
            },
            {
              tagName: 'colgroup',
              classNames: 'post-actions',
              children: [
                {
                  tagName: 'col',
                  classNames: ['edit']
                },
                {
                  tagName: 'col',
                  classNames: ['publish']
                },
                {
                  tagName: 'col',
                  classNames: ['unpublish']
                },
                {
                  tagName: 'col',
                  classNames: ['delete']
                },
              ]
            },
            {
              tagName: 'tbody',
              id: 'post-list'
            }
          ]
        }
      ]
    }))
    function updatePostKeys(postKeys) {
        document.getElementById('post-list').replaceChildren(..._.map(postKeys, (Key) => {
        const postIdParts = Key.split('/').pop().split('.')
        postIdParts.pop()
        const postId = postIdParts.join('.')
        const { post, publishedETag, saveState, publishState } =  loadAutosave(postId)
        return domNode({
          tagName: 'tr',
          classNames: 'post-list-entry',
          children: [
            {
              tagName: 'td',
              classNames: 'post-name',
              children: [postId]
            },
            {
              tagName: 'td',
              classNames: 'save-status',
              children: [saveState || translatableText.saveState.unmodified]
            },
            {
              tagName: 'td',
              classNames: 'publish-status',
              children: [publishState || translatableText.publishState.unknown]
            },
            {
              tagName: 'td',
              classNames: 'post-edit',
              children: [
                {
                  tagName: 'button',
                  onClick: () => {
                    window.location.href = `./edit.html?postId=${postId}`
                  },
                  children: [
                    translatableText.postActions.edit,
                  ],
                }
              ]
            },
            {
              tagName: 'td',
              classNames: 'post-publish',
              children: [
                {
                  tagName: 'button',
                  name: 'publish',
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
              ]
            },
            {
              tagName: 'td',
              classNames: 'post-unpublish',
              children: [
                {
                  tagName: 'button',
                  name: 'unpublish',
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
              ]
            },
            {
              tagName: 'td',
              classNames: 'post-delete',
              children: [
                {
                  tagName: 'button',
                  name: 'delete',
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
