const {EditorState, Plugin} = require("prosemirror-state")
const {EditorView, Decoration, DecorationSet} = require("prosemirror-view")
const {exampleSetup, placeholderPlugin} = require("./prosemirror-setup/index")

class MarkdownView {
  constructor(target, content) {
    this.textarea = target.appendChild(document.createElement("textarea"))
    this.textarea.value = content
  }

  get content() { return this.textarea.value }
  focus() { this.textarea.focus() }
  destroy() { this.textarea.remove() }
}

class ProseMirrorView {
  constructor(target, content) {
    this.view = new EditorView(target, {
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(content),
        plugins: exampleSetup({schema, config: window.CONFIG})
      })
    })
  }
  get content() {
    return defaultMarkdownSerializer.serialize(this.view.state.doc)
  }
  focus() { this.view.focus() }
  destroy() { this.view.destroy() }
}
/*
let place = document.querySelector("#editor")
let view = new MarkdownView(place, document.querySelector("#content").value)


document.querySelectorAll("input[type=radio]").forEach(button => {
  button.addEventListener("change", () => {
    if (!button.checked) return
      let View = button.value == "markdown" ? MarkdownView : ProseMirrorView
    if (view instanceof View) return
      let content = view.content
    view.destroy()
    view = new View(place, content)
    view.focus()
  })
})
*/

const {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  schema,
} = require('prosemirror-markdown')

const ADMIN_SITE_BKT = "admin-raphaelluckom-com"
const TEST_SITE_BKT = "test-raphaelluckom-com"
const BLOG_POST_PREFIX = "posts/"
const PRIV_LOAD_PATH = "img/"

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
    const view = new EditorView(container, {
      // Set initial state
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(area.value),
        plugins: exampleSetup({ schema, config: window.CONFIG }).concat(placeholderPlugin),
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

function listPostsDependencies(callback) {
  const dependencies = {
    credentials: {
      accessSchema: credentialsAccessSchema
    },
    putImg: {
      accessSchema: exploranda.dataSources.AWS.s3.listObjects,
      params: {
        apiConfig: apiConfigSelector,
        Bucket: {value: TEST_SITE_BKT },
        Prefix: { value: BLOG_POST_PREFIX },
      }
    },
  }
  exploranda.Gopher(dependencies).report(
    (e, r) => {
      console.log(e)
      console.log(r)
    }
  )
}

document.addEventListener('DOMContentLoaded', initWysiwyEditors)
