window.RENDER_CONFIG = {
  init: ({postKeys}) => {
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
