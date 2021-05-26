window.RENDER_CONFIG = {
  smallScreenFormatters: {
    toggleTray: () => {
      function toggleTray (evt) {
        evt.target.closest('.post-list-entry').classList.toggle('open')
      }
      function revert() {
        _.map(
          document.querySelectorAll('.post-list-entry'),
          (el) => {
            el.removeEventListener('click', toggleTray)
          }
        )
      }
      _.map(
        document.querySelectorAll('.post-list-entry'),
        (el) => {
          el.addEventListener('click', toggleTray)
        }
      )
      return revert
    }
  },
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
            const icon = document.getElementById('new-post-icon')
            const rotation = 'rotate(45, 50, 50)'
            if (icon.getAttribute('transform') === rotation) {
              icon.setAttribute('transform', '')
            } else {
              icon.setAttribute('transform', rotation)
            }
          },
          children: [
            {
              tagName: 'svg',
              width: '1.5em',
              height: '1.5em',
              viewBox: '0 0 100 100',
              children: [
                {
                  tagName: 'g',
                  id: 'new-post-icon',
                  children: [
                    {
                      tagName: 'line',
                      x1: 15,
                      y1: 50,
                      x2: 85,
                      y2: 50,
                      strokeWidth: '0.4em',
                      stroke: '#000',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                    },
                    {
                      tagName: 'line',
                      y1: 15,
                      x1: 50,
                      y2: 85,
                      x2: 50,
                      strokeWidth: '0.4em',
                      stroke: '#000',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                    },
                  ]
                }
              ]
            },
          ]
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
            classNames: 'post-actions-header',
          },
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
                  name: 'edit',
                  classNames: 'edit',
                  innerText: translatableText.postActions.edit,
                  onClick: () => {
                      window.location.href = `./edit.html?postId=${postId}`
                  }
                },
                {
                  tagName: 'button',
                  name: 'publish',
                  classNames: 'publish',
                  spin: true,
                  innerText: translatableText.postActions.publish,
                  onClick: function(evt, stopSpin) {
                    evt.stopPropagation()
                    goph.report(['saveAndPublishPostWithoutInput', 'confirmPostPublished'], {postId}, (e, r) => {
                      if (e) {
                        console.log(e)
                        return
                      }
                      stopSpin()
                    })
                  }
                },
                {
                  tagName: 'button',
                  name: 'unpublish',
                  classNames: 'unpublish',
                  spin: true,
                  innerText: translatableText.postActions.unpublish,
                  onClick: function(evt, stopSpin) {
                    evt.stopPropagation()
                    goph.report(['unpublishPostWithoutInput', 'confirmPostUnpublished'], {postId}, (e, r) => {
                      if (e) {
                        console.log(e)
                        return
                      }
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
                  innerText: translatableText.postActions.delete,
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
