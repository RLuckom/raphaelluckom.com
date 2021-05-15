window.RENDER_CONFIG = {
  init: ({postKeys}, gopher) => {
    const mainSection = document.querySelector('main')
    mainSection.appendChild(domNode({
      tagName: 'div',
      children: [
        {
          tagName: 'ul',
          classNames: [],
          children: [
            {
              tagName: 'li',
              children: [
                {
                  tagName: 'a',
                  href: '#',
                  onClick: () => document.getElementById('new-post').classList.toggle('expanded'),
                  innerText: 'X',
                }
              ]
            }
          ]
        },
        {
          tagName: 'div',
          children: [
            {
              tagName: 'input',
              type: 'text',
              id: 'new-post',
              classNames: ['new-post'],
              placeholder: 'enter a new post id, then press Enter',
              onInput: (evt) => {
                document.getElementById('post-url-display').innerText = `Post ID will be: ${encodeURIComponent(evt.target.value)}`
              },
              onKeyDown: (evt) => {
                if (evt.which === 13 && evt.target.value) {
                  window.location.href = `./edit.html?postId=${encodeURIComponent(evt.target.value)}`
                }
              }
            },
            {
              tagName: 'span',
              id: 'post-url-display'
            }
          ]
        }
      ]
    }))
    _.map(postKeys, (Key) => {
      const postId = Key.split('/').pop().split('.')[0]
      mainSection.appendChild(domNode({
        tagName: 'div',
        classNames: 'post-list-entry',
        children: [
          {
            tagName: 'div',
            className: 'post-name',
            children: [postId]
          },
          {
            tagName: 'a',
            className: 'post-edit',
            href: `/${CONFIG.plugin_root}edit.html?postId=${postId}`,
            children: ["Edit Post"],
          },
          {
            tagName: 'button',
            name: 'publish',
            id: 'publish',
            innerText: 'Publish to Blog',
            onClick: () => {
              goph.report('saveAndPublishPostWithoutInput', {postId}, (e, r) => {})
            }
          },
          {
            tagName: 'button',
            name: 'unpublish',
            id: 'unpublish',
            innerText: 'Remove from Blog',
            onClick: () => {
              goph.report('unpublishPostWithoutInput', {postId}, (e, r) => {})
            },
          },
          {
            tagName: 'button',
            name: 'delete',
            id: 'delete',
            innerText: 'Delete Post',
            onClick: () => {
              goph.report('deletePostWithoutInput', {postId}, (e, r) => {})
            },
          },
        ]
      }))
    })
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
