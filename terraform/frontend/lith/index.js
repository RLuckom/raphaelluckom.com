const {EditorState} = require("prosemirror-state")
const {EditorView} = require("prosemirror-view")
const {exampleSetup} = require("prosemirror-example-setup")

const {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  schema,
} = require('prosemirror-markdown')

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
        plugins: exampleSetup({ schema }),
      }),
      dispatchTransaction(tr) {
        const { state } = view.state.applyTransaction(tr)
        view.updateState(state)
        // Update textarea only if content has changed
        if (tr.docChanged) {
          area.value = defaultMarkdownSerializer.serialize(tr.doc)
        }
      },
    })
  }
}

document.addEventListener('DOMContentLoaded', initWysiwyEditors)
