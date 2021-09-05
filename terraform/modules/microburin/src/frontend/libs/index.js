window.RENDER_CONFIG = {
  init: ({connectionItems}) => {
    console.log(connectionItems)
    const mainSection = document.querySelector('main')
    mainSection.appendChild(domNode({
      tagName: 'div',
      id: 'microburin-social-nav',
      children: [
        {
          tagName: 'a',
          href: './connections.html',
          children: [
            'Connection list'
          ]
        }
      ]
    }))
  },
  params: {
    connectionItems: {
      source: 'connectionItems',
      formatter: ({connectionItems}) => {
        return connectionItems
      }
    },
  },
  onAPIError: (e, r, cb) => {
    console.error(e)
    if (_.isString(_.get(e, 'message')) && e.message.indexOf('401') !== -1) {
      location.reload()
    }
    return cb(e, r)
  },
}
