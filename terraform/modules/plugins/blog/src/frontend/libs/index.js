window.RENDER_CONFIG = {
  init: ({postKeys}, gopher) => {
    const mainSection = document.querySelector('main')
    const closeInputButtonText = 'X'
    window.addEventListener('pageshow', () => {
      goph.report('listPosts', (e, {listPosts}) => {
        const postKeys = _.map(listPosts[0], 'Key')
        updatePostKeys(postKeys)
      })
    })
    const slashReplacement = '-'

    mainSection.appendChild(domNode({
      tagName: 'div',
      id: 'new-post-container',
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
    }))
    mainSection.appendChild(domNode(
      {
        tagName: 'div',
        id: 'post-running-material',
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
                    classNames: 'post-id-header',
                    children: ["Post ID"]
                  },
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
              {
                tagName: 'div',
                classNames: 'post-actions',
              },
            ]
          }
        ]
      }
    ))
    mainSection.appendChild(domNode({
      tagName: 'div',
      id: 'post-list'
    }))
    function updatePostKeys(postKeys) {
      document.getElementById('post-list').replaceChildren(..._.map(postKeys, (Key) => {
        const postIdParts = Key.split('/').pop().split('.')
        postIdParts.pop()
        const postId = postIdParts.join('.')
        const { post, publishedETag, saveState, publishState } =  loadAutosave(postId)
        return domNode({
          tagName: 'div',
          classNames: 'post-list-entry closed',
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
                      tagName: 'a',
                      classNames: 'post-id',
                      href: `./edit.html?postId=${postId}`,
                        children: [
                        {
                          tagName: 'div',
                          children: [postId]
                        },
                      ]
                    },
                    {
                      tagName: 'div',
                      classNames: 'save-status',
                      children: [saveState || translatableText.saveState.unmodified]
                    },
                    {
                      tagName: 'div',
                      classNames: 'publish-status',
                      children: [publishState || translatableText.publishState.unknown]
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
                  name: 'publish',
                  classNames: 'publish',
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
                  classNames: 'unpublish',
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
                  classNames: 'delete',
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
