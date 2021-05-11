function init() {
  goph.report('getPost', {postId: 'example'}, (e, r) => {
    console.log(e)
    console.log(r)
  })
  goph.report('listPosts', {}, (e, r) => {
    if (e) {
      console.log(e)
      return e
    }
    const postListSection = document.getElementById('posts')
    _.map(r.listPosts[0], ({Key}) => {
      const postId = _.trimEnd(Key.split('/').pop(), '.md')
      postListSection.appendChild(domNode({
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
  })
}

document.addEventListener('DOMContentLoaded', init)
