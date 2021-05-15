window.RENDER_CONFIG = {
  init: ({postKeys}, gopher) => {
    const mainSection = document.querySelector('main')
    _.map(postKeys, (Key) => {
      const postId = _.trimEnd(Key.split('/').pop(), '.md')
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
