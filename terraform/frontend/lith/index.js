const {EditorState, Plugin} = require("prosemirror-state")
const {EditorView, Decoration, DecorationSet} = require("prosemirror-view")
const {exampleSetup} = require("./prosemirror-setup/index")

const {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  schema,
} = require('prosemirror-markdown')

let view

// https://gist.github.com/mbrehin/05c0d41a7e50eef7f95711e237502c85
// script to replace <textarea> elements in forms with prosemirror editors 
// ( if they have the .prosemirror class ) 
function initWysiwyEditors() {
  // Loop over every textareas to replace with dynamic editor
  for (const area of document.querySelectorAll('textarea.prosemirror')) {
    // Hide textarea
    area.style.display = 'none'
    // Create container zone
    const container = document.createElement('div')
    container.classList = area.classList
    if (area.nextSibling) {
      area.parentElement.insertBefore(container, area.nextSibling)
    } else {
      area.parentElement.appendChild(container)
    }

    // Load editor view
    view = new EditorView(container, {
      // Set initial state
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(area.value),
        plugins: exampleSetup({ schema }).concat(placeholderPlugin),
      }),
      dispatchTransaction(tr) {
        const { state } = view.state.applyTransaction(tr)
        view.updateState(state)
        // Update textarea only if content has changed
        if (tr.docChanged) {
          console.log(defaultMarkdownSerializer.serialize(tr.doc))
          area.value = defaultMarkdownSerializer.serialize(tr.doc)
        }
      },
    })
  }
}

let placeholderPlugin = new Plugin({
  state: {
    init() { return DecorationSet.empty },
    apply(tr, set) {
      // Adjust decoration positions to changes made by the transaction
      set = set.map(tr.mapping, tr.doc)
      // See if the transaction adds or removes any placeholders
      let action = tr.getMeta(this)
      if (action && action.add) {
        let widget = document.createElement("placeholder")
        let deco = Decoration.widget(action.add.pos, widget, {id: action.add.id})
        set = set.add(tr.doc, [deco])
      } else if (action && action.remove) {
        set = set.remove(set.find(null, null,
                                  spec => spec.id == action.remove.id))
      }
      return set
    }
  },
  props: {
    decorations(state) { return this.getState(state) }
  }
})

function findPlaceholder(state, id) {
  let decos = placeholderPlugin.getState(state)
  let found = decos.find(null, null, spec => spec.id == id)
  return found.length ? found[0].from : null
}

function startImageUpload(view, file) {
  // A fresh object to act as the ID for this upload
  let id = {}

  // Replace the selection with a placeholder
  let tr = view.state.tr
  if (!tr.selection.empty) tr.deleteSelection()
  tr.setMeta(placeholderPlugin, {add: {id, pos: tr.selection.from}})
  view.dispatch(tr)

  file.arrayBuffer().then((buffer) => {
    uploadFile(buffer, (e, url) => {
      if (e) {
        return view.dispatch(tr.setMeta(placeholderPlugin, {remove: {id}}))
      }
      let pos = findPlaceholder(view.state, id)
      // If the content around the placeholder has been deleted, drop
      // the image
      if (pos == null) return
        // Otherwise, insert it at the placeholder's position, and remove
        // the placeholder
        view.dispatch(view.state.tr
                      .replaceWith(pos, pos, schema.nodes.image.create({src: url}))
                      .setMeta(placeholderPlugin, {remove: {id}}))
    })
  })
}

const ATTN_BKT = "test-human-attention"
const ATTN_PATH = "uploads/test-site/img/"
const PRIV_LOAD_PATH = "staged-images/"

//TODO: how to pick name for img
function getName() {
  return "name"
}
const credentialsAccessSchema = {
  name: 'site AWS credentials',
  value: {path: 'body'},
  dataSource: 'GENERIC_API',
  host: window.location.hostname,
  path: 'api/actions/access/credentials'
}

const apiConfigSelector = {
  source: 'credentials',
  formatter: ({credentials}) => {
    console.log(credentials)
    return {
      region: 'us-east-1',
      accessKeyId: credentials[0].Credentials.AccessKeyId,
      secretAccessKey: credentials[0].Credentials.SecretKey,
      sessionToken: credentials[0].Credentials.SessionToken
    }
  }
}

function uploadFile(buffer, callback) {
  const rawName = getName()
  const putPath = ATTN_PATH + rawName
  const getUrl = "https://admin.raphaelluckom.com/" + PRIV_LOAD_PATH + rawName 
  const dependencies = {
    credentials: {
      accessSchema: credentialsAccessSchema
    },
    putImg: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        apiConfig: apiConfigSelector,
        Body: {value: buffer },
        Bucket: {value: ATTN_BKT },
        Key: { value: putPath },
      }
    },
    pollImage: {
      accessSchema: {
        name: 'GET url',
        dataSource: 'GENERIC_API',
        value: {path:  _.identity},
      },
      params: {
        apiConfig: {value: {
          url: getUrl,
          method: 'HEAD'
        }},
      },
      behaviors: {
        retryParams: {
          errorFilter: (err) => {
            console.log(err)
            console.log("filter")
            return err === 404
          },
          times: 10,
          interval: (n) => n * 1000
        },
        detectErrors: (err, res) => {
          console.log(err)
          if (err) {
            return 404
          }
        }
      }
    }
  }
  exploranda.Gopher(dependencies).report(
    (e, r) => {
      console.log(e)
      console.log(r)
      callback(e, getUrl)
    }
  )
}

document.addEventListener('DOMContentLoaded', initWysiwyEditors)
document.querySelector("#image-upload").addEventListener("change", e => {
  if (view.state.selection.$from.parent.inlineContent && e.target.files.length)
    startImageUpload(view, e.target.files[0])
  view.focus()
})
