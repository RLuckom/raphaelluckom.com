window.RENDER_CONFIG = {
  smallScreenFormatters: {
    toggleTray: () => {
      function toggleTray (evt) {
        evt.target.closest('.connection-list-entry').classList.toggle('open')
      }
      function revert() {
        _.map(
          document.querySelectorAll('.connection-list-entry'),
          (el) => {
            el.removeEventListener('click', toggleTray)
          }
        )
      }
      _.map(
        document.querySelectorAll('.connection-list-entry'),
        (el) => {
          el.addEventListener('click', toggleTray)
        }
      )
      return revert
    }
  },
  init: ({connections}, gopher) => {
    console.log(connections)
    const mainSection = document.querySelector('main')
    const closeInputButtonText = 'X'
    function refreshConnectionList(cb) {
      cb = cb || function(e) { 
        return e ? console.log(e) : null 
      }
      gopher.report(['connections'], (e, {connections}) => {
        console.log(connections)
        if (e) {
          return cb(e)
        }
        try {
          updateConnections({connections})
        } catch(e) {
          return cb(e)
        }
        return cb()
      })
    }
    window.addEventListener('pageshow', refreshConnectionList)
    const slashReplacement = '-'

    mainSection.appendChild(domNode({
      tagName: 'div',
      id: 'new-connection-container',
      children: [
        {
          tagName: 'button',
          id: 'new-connection-button',
          onClick: () => {
            document.getElementById('new-connection').classList.toggle('expanded')
            const icon = document.getElementById('new-connection-icon')
            const rotation = 'rotate(45, 50, 50)'
            if (icon.getAttribute('transform') === rotation) {
              icon.setAttribute('transform', '')
            } else {
              icon.setAttribute('transform', rotation)
              document.getElementById('new-connection').focus()
            }
          },
          children: [
            {
              tagName: 'svg',
              width: '2.5em',
              height: '2.5em',
              viewBox: '0 0 100 100',
              children: [
                {
                  tagName: 'g',
                  id: 'new-connection-icon',
                  children: [
                    {
                      tagName: 'line',
                      x1: 15,
                      y1: 50,
                      x2: 85,
                      y2: 50,
                      strokeWidth: '5px',
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
                      strokeWidth: '5px',
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
          id: 'new-connection',
          classNames: ['new-connection'],
          placeholder: I18N_CONFIG.postMetadata.placeholders.id,
          onKeyDown: (evt) => {
            if (evt.which === 13 && evt.target.value) {
              goph.report(['sendConnectionRequest'], {connectionId: evt.target.value}, (e, r) => {
                if (e) {
                  console.log(e)
                }
                console.log('Add connection: ' + evt.target.value)
                refreshConnectionList()
              })
            }
          }
        },
      ]
    }))
    mainSection.appendChild(domNode(
      {
        tagName: 'div',
        id: 'connection-list-header',
        children: [
          {
            tagName: 'div',
            classNames: 'post-status-headers',
            children: [
              {
                tagName: 'div',
                classNames: 'post-id-header',
                children: [
                  I18N_CONFIG.connectionHeaders.domain,
                ]
              },
              {
                tagName: 'div',
                classNames: 'publish-status-header',
                children: [
                  I18N_CONFIG.connectionHeaders.connectionStatus,
                ]
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
      id: 'connection-list'
    }))
    function updateConnections(connections) {
      document.getElementById('connection-list').replaceChildren(..._.map(connections.connections, ({domain, connectionType, connectionState, requestExpires}) => {
        const connectionStateKey = _.find(I18N_CONFIG.connectionStates, (v, k) => {
          return v.code === connectionState && v
        })
        return domNode({
          tagName: 'div',
          classNames: 'connection-list-entry',
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
                      children: [domain]
                    },
                    {
                      tagName: 'div',
                      classNames: 'publish-status',
                      children: [ connectionStateKey.message ],
                    },
                  ]
                },
              ]
            },
            {
              tagName: 'div',
              classNames: 'post-actions',
              children: _.map(connectionStateKey.transitions, ({transitionMethod, message, nextState}) => {
                return {
                  tagName: 'button',
                  name: nextState || 'null',
                  classNames: [],
                  spin: true,
                  innerText: message,
                  onClick: function(evt, stopSpin) {
                    evt.stopPropagation()
                    goph.report([transitionMethod], {connectionId: domain}, (e, r) => {
                      if (e) {
                        console.log(e)
                      }
                      stopSpin()
                      refreshConnectionList()
                    })
                  }
                }
              })
            },
          ]
        })
      }))
    }
    updateConnections(connections)
  },
  params: {
    connections: {
      source: 'connections',
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
