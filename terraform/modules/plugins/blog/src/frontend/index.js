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

const dummyAccessSchema = {
  name: 'dummy lambda',
  value: {path: 'body'},
  dataSource: 'GENERIC_API',
  host: window.location.hostname,
  path: 'plugins/blog/post-entry'
}

function listPostsDependencies(callback) {
  const dependencies = {
    dummy: {
      accessSchema: dummyAccessSchema
    },
  }
  exploranda.Gopher(dependencies).report(
    (e, r) => {
      console.log('end')
      console.log(e)
      console.log(r)
    }
  )
}

const listBucketDependencies = {
  credentials: {
    accessSchema: credentialsAccessSchema
  },
  bucketDependencies: {
    accessSchema: exploranda.dataSources.AWS.s3.listObjects,
    params: {
      apiConfig: apiConfigSelector,
      Bucket: {value: CONFIG.private_storage_bucket },
      Prefix: {
        input: 'prefix',
        formatter: (arg) => {
          console.log(arg)
          return arg.prefix
        }
      },
    }
  },
};

goph = exploranda.Gopher(listBucketDependencies, {prefix: CONFIG.hosting_root})

function listBucketObjects(callback) {
  goph.report(
    (e, r) => {
      console.log('end')
      console.log(e)
      console.log(r)
    }
  )
}

document.addEventListener('DOMContentLoaded', initWysiwyEditors)
document.addEventListener('DOMContentLoaded', listPostsDependencies)
