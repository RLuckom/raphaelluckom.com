
function domNode({tagName, classNames, innerText, href, onClick}) {
  const el = document.createElement(tagName)
  if (_.isArray(classNames)) {
    el.className = ' '.join(classNames)
  }
  if (_.isString(classNames)) {
    el.className = classNames
  }
  if (_.isString(href)) {
    el.href = href
  }
  if (_.isString(innerText)) {
    el.innerText = innerText
  }
  if (_.isDunction(onClick)) {
    el.onclick = onClick
  }
  return el
}

const defaultButton = {
  tagName: 'button',
  classNames: 'standard-button',
}

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
      const postListEntry = document.createElement('div')
      const postEditButton = document.createElement('div')
      const postPublishButton = document.createElement('div')
      const postUnpublishButton = document.createElement('div')
      postListEntry.className = "post-entry"
      const postName = document.createElement('div')
      postName.className = "post-name"
      postName.innerText = _.trimEnd(Key.split('/').pop(), '.md')
      postListEntry.appendChild(postName)
      postListSection.appendChild(postListEntry)
    })
  })
}

document.addEventListener('DOMContentLoaded', init)
