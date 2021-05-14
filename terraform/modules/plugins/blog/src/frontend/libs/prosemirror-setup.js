
// PROMPT
//
const prefix = "ProseMirror-prompt"

function openPrompt(options) {
  let wrapper = document.body.appendChild(document.createElement("div"))
  wrapper.className = prefix

  let mouseOutside = e => { if (!wrapper.contains(e.target)) close() }
  setTimeout(() => window.addEventListener("mousedown", mouseOutside), 50)
  let close = () => {
    window.removeEventListener("mousedown", mouseOutside)
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper)
  }

  let domFields = []
  for (let name in options.fields) domFields.push(options.fields[name].render())

  let submitButton = document.createElement("button")
  submitButton.type = "submit"
  submitButton.className = prefix + "-submit"
  submitButton.textContent = "OK"
  let cancelButton = document.createElement("button")
  cancelButton.type = "button"
  cancelButton.className = prefix + "-cancel"
  cancelButton.textContent = "Cancel"
  cancelButton.addEventListener("click", close)

  let form = wrapper.appendChild(document.createElement("form"))
  if (options.title) form.appendChild(document.createElement("h5")).textContent = options.title
  domFields.forEach(field => {
    form.appendChild(document.createElement("div")).appendChild(field)
  })
  let buttons = form.appendChild(document.createElement("div"))
  buttons.className = prefix + "-buttons"
  buttons.appendChild(submitButton)
  buttons.appendChild(document.createTextNode(" "))
  buttons.appendChild(cancelButton)

  let box = wrapper.getBoundingClientRect()
  wrapper.style.top = ((window.innerHeight - box.height) / 2) + "px"
  wrapper.style.left = ((window.innerWidth - box.width) / 2) + "px"

  let submit = () => {
    let params = getValues(options.fields, domFields)
    if (params) {
      close()
      options.callback(params)
    }
  }

  form.addEventListener("submit", e => {
    e.preventDefault()
    submit()
  })

  form.addEventListener("keydown", e => {
    if (e.keyCode == 27) {
      e.preventDefault()
      close()
    } else if (e.keyCode == 13 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.preventDefault()
      submit()
    } else if (e.keyCode == 9) {
      window.setTimeout(() => {
        if (!wrapper.contains(document.activeElement)) close()
      }, 500)
    }
  })

  let input = form.elements[0]
  if (input) input.focus()
}

function getValues(fields, domFields) {
  let result = Object.create(null), i = 0
  for (let name in fields) {
    let field = fields[name], dom = domFields[i++]
    let value = field.read(dom), bad = field.validate(value)
    if (bad) {
      reportInvalid(dom, bad)
      return null
    }
    result[name] = field.clean(value)
  }
  return result
}

function reportInvalid(dom, message) {
  // FIXME this is awful and needs a lot more work
  let parent = dom.parentNode
  let msg = parent.appendChild(document.createElement("div"))
  msg.style.left = (dom.offsetLeft + dom.offsetWidth + 2) + "px"
  msg.style.top = (dom.offsetTop - 5) + "px"
  msg.className = "ProseMirror-invalid"
  msg.textContent = message
  setTimeout(() => parent.removeChild(msg), 1500)
}

// ::- The type of field that `FieldPrompt` expects to be passed to it.
class Field {
  // :: (Object)
  // Create a field with the given options. Options support by all
  // field types are:
  //
  // **`value`**`: ?any`
  //   : The starting value for the field.
  //
  // **`label`**`: string`
  //   : The label for the field.
  //
  // **`required`**`: ?bool`
  //   : Whether the field is required.
  //
  // **`validate`**`: ?(any) → ?string`
  //   : A function to validate the given value. Should return an
  //     error message if it is not valid.
  constructor(options) { this.options = options }

  // render:: (state: EditorState, props: Object) → dom.Node
  // Render the field to the DOM. Should be implemented by all subclasses.

  // :: (dom.Node) → any
  // Read the field's value from its DOM node.
  read(dom) { return dom.value }

  // :: (any) → ?string
  // A field-type-specific validation function.
  validateType(_value) {}

  validate(value) {
    if (!value && this.options.required)
      return "Required field"
    return this.validateType(value) || (this.options.validate && this.options.validate(value))
  }

  clean(value) {
    return this.options.clean ? this.options.clean(value) : value
  }
}

// ::- A field class for single-line text fields.
class TextField extends Field {
  render() {
    let input = document.createElement("input")
    input.type = "text"
    input.placeholder = this.options.label
    input.value = this.options.value || ""
    input.autocomplete = "off"
    return input
  }
}

// ::- A field class for single-line text fields.
class FileField extends Field {
  read(dom) { return dom.files[0] }
  render() {
    let input = document.createElement("input")
    input.type = "file"
    input.value = this.options.value || ""
    return input
  }
}


// ::- A field class for dropdown fields based on a plain `<select>`
// tag. Expects an option `options`, which should be an array of
// `{value: string, label: string}` objects, or a function taking a
// `ProseMirror` instance and returning such an array.
class SelectField extends Field {
  render() {
    let select = document.createElement("select")
    this.options.options.forEach(o => {
      let opt = select.appendChild(document.createElement("option"))
      opt.value = o.value
      opt.selected = o.value == this.options.value
      opt.label = o.label
    })
    return select
  }
}


// MENU

function canInsert(state, nodeType) {
  let $from = state.selection.$from
  for (let d = $from.depth; d >= 0; d--) {
    let index = $from.index(d)
    if ($from.node(d).canReplaceWith(index, index, nodeType)) return true
  }
  return false
}

function cmdItem(cmd, options) {
  let passedOptions = {
    label: options.title,
    run: cmd
  }
  for (let prop in options) passedOptions[prop] = options[prop]
  if ((!options.enable || options.enable === true) && !options.select)
    passedOptions[options.enable ? "enable" : "select"] = state => cmd(state)

  return new prosemirror.MenuItem(passedOptions)
}

function markActive(state, type) {
  let {from, $from, to, empty} = state.selection
  if (empty) return type.isInSet(state.storedMarks || $from.marks())
  else return state.doc.rangeHasMark(from, to, type)
}

function markItem(markType, options) {
  let passedOptions = {
    active(state) { return markActive(state, markType) },
    enable: true
  }
  for (let prop in options) passedOptions[prop] = options[prop]
  return cmdItem(prosemirror.toggleMark(markType), passedOptions)
}

function linkItem(markType) {
  return new prosemirror.MenuItem({
    title: "Add or remove link",
    icon: prosemirror.icons.link,
    active(state) { return markActive(state, markType) },
    enable(state) { return !state.selection.empty },
    run(state, dispatch, view) {
      if (markActive(state, markType)) {
        prosemirror.toggleMark(markType)(state, dispatch)
        return true
      }
      openPrompt({
        title: "Create a link",
        fields: {
          href: new TextField({
            label: "Link target",
            required: true
          }),
          title: new TextField({label: "Title"})
        },
        callback(attrs) {
          prosemirror.toggleMark(markType, attrs)(view.state, view.dispatch)
          view.focus()
        }
      })
    }
  })
}

function wrapListItem(nodeType, options) {
  return cmdItem(prosemirror.wrapInList(nodeType, options.attrs), options)
}

// :: (Schema) → Object
// Given a schema, look for default mark and node types in it and
// return an object with relevant menu items relating to those marks:
//
// **`toggleStrong`**`: MenuItem`
//   : A menu item to toggle the [strong mark](#schema-basic.StrongMark).
//
// **`toggleEm`**`: MenuItem`
//   : A menu item to toggle the [emphasis mark](#schema-basic.EmMark).
//
// **`toggleCode`**`: MenuItem`
//   : A menu item to toggle the [code font mark](#schema-basic.CodeMark).
//
// **`toggleLink`**`: MenuItem`
//   : A menu item to toggle the [link mark](#schema-basic.LinkMark).
//
// **`insertImage`**`: MenuItem`
//   : A menu item to insert an [image](#schema-basic.Image).
//
// **`wrapBulletList`**`: MenuItem`
//   : A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).
//
// **`wrapOrderedList`**`: MenuItem`
//   : A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).
//
// **`wrapBlockQuote`**`: MenuItem`
//   : A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).
//
// **`makeParagraph`**`: MenuItem`
//   : A menu item to set the current textblock to be a normal
//     [paragraph](#schema-basic.Paragraph).
//
// **`makeCodeBlock`**`: MenuItem`
//   : A menu item to set the current textblock to be a
//     [code block](#schema-basic.CodeBlock).
//
// **`makeHead[N]`**`: MenuItem`
//   : Where _N_ is 1 to 6. Menu items to set the current textblock to
//     be a [heading](#schema-basic.Heading) of level _N_.
//
// **`insertHorizontalRule`**`: MenuItem`
//   : A menu item to insert a horizontal rule.
//
// The return value also contains some prefabricated menu elements and
// menus, that you can use instead of composing your own menu from
// scratch:
//
// **`insertMenu`**`: Dropdown`
//   : A dropdown containing the `insertImage` and
//     `insertHorizontalRule` items.
//
// **`typeMenu`**`: Dropdown`
//   : A dropdown containing the items for making the current
//     textblock a paragraph, code block, or heading.
//
// **`fullMenu`**`: [[MenuElement]]`
//   : An array of arrays of menu elements for use as the full menu
//     for, for example the [menu bar](https://github.com/prosemirror/prosemirror-menu#user-content-menubar).
function buildMenuItems({schema, insertImageItem}) {
  let r = {}, type
  if (type = schema.marks.strong)
    r.toggleStrong = markItem(type, {title: "Toggle strong style", icon: prosemirror.icons.strong})
  if (type = schema.marks.em)
    r.toggleEm = markItem(type, {title: "Toggle emphasis", icon: prosemirror.icons.em})
  if (type = schema.marks.code)
    r.toggleCode = markItem(type, {title: "Toggle code font", icon: prosemirror.icons.code})
  if (type = schema.marks.link)
    r.toggleLink = linkItem(type)

  if (type = schema.nodes.image)
    r.insertImage = insertImageItem(type)
  if (type = schema.nodes.bullet_list)
    r.wrapBulletList = wrapListItem(type, {
      title: "Wrap in bullet list",
      icon: prosemirror.icons.bulletList
    })
  if (type = schema.nodes.ordered_list)
    r.wrapOrderedList = wrapListItem(type, {
      title: "Wrap in ordered list",
      icon: prosemirror.icons.orderedList
    })
  if (type = schema.nodes.blockquote)
    r.wrapBlockQuote = prosemirror.wrapItem(type, {
      title: "Wrap in block quote",
      icon: prosemirror.icons.blockquote
    })
  if (type = schema.nodes.paragraph)
    r.makeParagraph = prosemirror.blockTypeItem(type, {
      title: "Change to paragraph",
      label: "Plain"
    })
  if (type = schema.nodes.code_block)
    r.makeCodeBlock = prosemirror.blockTypeItem(type, {
      title: "Change to code block",
      label: "Code"
    })
  if (type = schema.nodes.heading)
    for (let i = 1; i <= 10; i++)
      r["makeHead" + i] = prosemirror.blockTypeItem(type, {
        title: "Change to heading " + i,
        label: "Level " + i,
        attrs: {level: i}
      })
  if (type = schema.nodes.horizontal_rule) {
    let hr = type
    r.insertHorizontalRule = new prosemirror.MenuItem({
      title: "Insert horizontal rule",
      label: "Horizontal rule",
      enable(state) { return canInsert(state, hr) },
      run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())) }
    })
  }

  let cut = arr => arr.filter(x => x)
  r.insertMenu = new prosemirror.Dropdown(cut([r.insertImage, r.insertHorizontalRule]), {label: "Insert"})
  r.typeMenu = new prosemirror.Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new prosemirror.DropdownSubmenu(cut([
    r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
  ]), {label: "Heading"})]), {label: "Type..."})

  r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])]
  r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, prosemirror.joinUpItem,
                      prosemirror.liftItem, prosemirror.selectParentNodeItem])]
  r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[prosemirror.undoItem, prosemirror.redoItem]], r.blockMenu)

  return r
}



// KEYMAP
const mac = typeof navigator != "undefined" ? /Mac/.test(navigator.platform) : false

// :: (Schema, ?Object) → Object
// Inspect the given schema looking for marks and nodes from the
// basic schema, and if found, add key bindings related to them.
// This will add:
//
// * **Mod-b** for toggling [strong](#schema-basic.StrongMark)
// * **Mod-i** for toggling [emphasis](#schema-basic.EmMark)
// * **Mod-`** for toggling [code font](#schema-basic.CodeMark)
// * **Ctrl-Shift-0** for making the current textblock a paragraph
// * **Ctrl-Shift-1** to **Ctrl-Shift-Digit6** for making the current
//   textblock a heading of the corresponding level
// * **Ctrl-Shift-Backslash** to make the current textblock a code block
// * **Ctrl-Shift-8** to wrap the selection in an ordered list
// * **Ctrl-Shift-9** to wrap the selection in a bullet list
// * **Ctrl->** to wrap the selection in a block quote
// * **Enter** to split a non-empty textblock in a list item while at
//   the same time splitting the list item
// * **Mod-Enter** to insert a hard break
// * **Mod-_** to insert a horizontal rule
// * **Backspace** to undo an input rule
// * **Alt-ArrowUp** to `joinUp`
// * **Alt-ArrowDown** to `joinDown`
// * **Mod-BracketLeft** to `lift`
// * **Escape** to `selectParentNode`
//
// You can suppress or map these bindings by passing a `mapKeys`
// argument, which maps key names (say `"Mod-B"` to either `false`, to
// remove the binding, or a new key name string.
function buildKeymap(schema, mapKeys) {
  let keys = {}, type
  function bind(key, cmd) {
    if (mapKeys) {
      let mapped = mapKeys[key]
      if (mapped === false) return
      if (mapped) key = mapped
    }
    keys[key] = cmd
  }


  bind("Mod-z", prosemirror.undo)
  bind("Shift-Mod-z", prosemirror.redo)
  bind("Backspace", prosemirror.undoInputRule)
  if (!mac) bind("Mod-y", prosemirror.redo)

  bind("Alt-ArrowUp", prosemirror.joinUp)
  bind("Alt-ArrowDown", prosemirror.joinDown)
  bind("Mod-BracketLeft", prosemirror.lift)
  bind("Escape", prosemirror.selectParentNode)

  if (type = schema.marks.strong) {
    bind("Mod-b", prosemirror.toggleMark(type))
    bind("Mod-B", prosemirror.toggleMark(type))
  }
  if (type = schema.marks.em) {
    bind("Mod-i", prosemirror.toggleMark(type))
    bind("Mod-I", prosemirror.toggleMark(type))
  }
  if (type = schema.marks.code)
    bind("Mod-`", prosemirror.toggleMark(type))

  if (type = schema.nodes.bullet_list)
    bind("Shift-Ctrl-8", prosemirror.wrapInList(type))
  if (type = schema.nodes.ordered_list)
    bind("Shift-Ctrl-9", prosemirror.wrapInList(type))
  if (type = schema.nodes.blockquote)
    bind("Ctrl->", prosemirror.wrapIn(type))
  if (type = schema.nodes.hard_break) {
    let br = type, cmd = prosemirror.chainCommands(prosemirror.exitCode, (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
      return true
    })
    bind("Mod-Enter", cmd)
    bind("Shift-Enter", cmd)
    if (mac) bind("Ctrl-Enter", cmd)
  }
  if (type = schema.nodes.list_item) {
    bind("Enter", prosemirror.splitListItem(type))
    bind("Mod-[", prosemirror.liftListItem(type))
    bind("Mod-]", prosemirror.sinkListItem(type))
  }
  if (type = schema.nodes.paragraph)
    bind("Shift-Ctrl-0", prosemirror.setBlockType(type))
  if (type = schema.nodes.code_block)
    bind("Shift-Ctrl-\\", prosemirror.setBlockType(type))
  if (type = schema.nodes.heading)
    for (let i = 1; i <= 6; i++) bind("Shift-Ctrl-" + i, prosemirror.setBlockType(type, {level: i}))
  if (type = schema.nodes.horizontal_rule) {
    let hr = type
    bind("Mod-_", (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView())
      return true
    })
  }

  return keys
}


// INPUTRULES

// : (NodeType) → InputRule
// Given a blockquote node type, returns an input rule that turns `"> "`
// at the start of a textblock into a blockquote.
function blockQuoteRule(nodeType) {
  return prosemirror.wrappingInputRule(/^\s*>\s$/, nodeType)
}

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a number
// followed by a dot at the start of a textblock into an ordered list.
function orderedListRule(nodeType) {
  return prosemirror.wrappingInputRule(/^(\d+)\.\s$/, nodeType, match => ({order: +match[1]}),
                           (match, node) => node.childCount + node.attrs.order == +match[1])
}

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a bullet
// (dash, plush, or asterisk) at the start of a textblock into a
// bullet list.
function bulletListRule(nodeType) {
  return prosemirror.wrappingInputRule(/^\s*([-+*])\s$/, nodeType)
}

// : (NodeType) → InputRule
// Given a code block node type, returns an input rule that turns a
// textblock starting with three backticks into a code block.
function codeBlockRule(nodeType) {
  return prosemirror.textblockTypeInputRule(/^```$/, nodeType)
}

// : (NodeType, number) → InputRule
// Given a node type and a maximum level, creates an input rule that
// turns up to that number of `#` characters followed by a space at
// the start of a textblock into a heading whose level corresponds to
// the number of `#` signs.
function headingRule(nodeType, maxLevel) {
  return prosemirror.textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"),
                                nodeType, match => ({level: match[1].length}))
}

// : (Schema) → Plugin
// A set of input rules for creating the basic block quotes, lists,
// code blocks, and heading.
function buildInputRules(schema) {
  let rules = prosemirror.smartQuotes.concat(prosemirror.ellipsis, prosemirror.emDash), type
  if (type = schema.nodes.blockquote) rules.push(blockQuoteRule(type))
  if (type = schema.nodes.ordered_list) rules.push(orderedListRule(type))
  if (type = schema.nodes.bullet_list) rules.push(bulletListRule(type))
  if (type = schema.nodes.code_block) rules.push(codeBlockRule(type))
  if (type = schema.nodes.heading) rules.push(headingRule(type, 6))
  return prosemirror.inputRules({rules})
}


//EXAMPLESETUP
//
//
// !! This module exports helper functions for deriving a set of basic
// menu items, input rules, or key bindings from a schema. These
// values need to know about the schema for two reasons—they need
// access to specific instances of node and mark types, and they need
// to know which of the node and mark types that they know about are
// actually present in the schema.
//
// The `exampleSetup` plugin ties these together into a plugin that
// will automatically enable this basic functionality in an editor.

// :: (Object) → [Plugin]
// A convenience plugin that bundles together a simple menu with basic
// key bindings, input rules, and styling for the example schema.
// Probably only useful for quickly setting up a passable
// editor—you'll need more control over your settings in most
// real-world situations.
//
//   options::- The following options are recognized:
//
//     schema:: Schema
//     The schema to generate key bindings and menu items for.
//
//     mapKeys:: ?Object
//     Can be used to [adjust](#example-setup.buildKeymap) the key bindings created.
//
//     menuBar:: ?bool
//     Set to false to disable the menu bar.
//
//     history:: ?bool
//     Set to false to disable the history plugin.
//
//     floatingMenu:: ?bool
//     Set to false to make the menu bar non-floating.
//
//     menuContent:: [[MenuItem]]
//     Can be used to override the menu content.
function prosemirrorView(container, uploadImage, onChange, initialState, initialMarkdownText) {
  const imageIdPlugin = new prosemirror.Plugin({
    key: 'imageIds',
    state: {
      init() { return [] },
      toJSON(val) { return JSON.stringify(val) },
      fromJSON(conf, val, edState) { return JSON.parse(val) },
      apply(tr,val, state) {
        let action = tr.getMeta(this)
        if (action && action.add) {
          const currentState = this.getState(state)
          const ids =  _.concat(currentState, [action.add.imageId])
          return ids
        }
        return val
      }
    }
  })

  const statePluginFields = {
    imageIds: imageIdPlugin
  }

  const placeholderPlugin = new prosemirror.Plugin({
    state: {
      init() { return prosemirror.DecorationSet.empty },
      apply(tr, set) {
        // Adjust decoration positions to changes made by the transaction
        set = set.map(tr.mapping, tr.doc)
        // See if the transaction adds or removes any placeholders
        let action = tr.getMeta(this)
        console.log(action)
        if (action && action.add) {
          let widget = domNode({
            tagName: 'img',
            src: URL.createObjectURL(_.get(action, 'add.file')),
            classNames: ['placeholder'],
          })
          console.log(widget)
          let deco = prosemirror.Decoration.widget(action.add.pos, widget, {id: action.add.id})
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

  function insertImageItem(nodeType) {
    return new prosemirror.MenuItem({
      title: "Insert image",
      label: "Image",
      enable(state) { return canInsert(state, nodeType) },
      run(state, _, view) {
        let {from, to} = state.selection, attrs = null
        if (state.selection instanceof prosemirror.NodeSelection && state.selection.node.type == nodeType) {
          attrs = state.selection.node.attrs
        }
        openPrompt({
          title: "Insert image",
          fields: {
            src: new FileField({label: "File", required: true, value: attrs && attrs.src}),
            title: new TextField({label: "Title", value: attrs && attrs.title}),
            alt: new TextField({label: "Description",
                               value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ")})
          },
          callback(attrs) {
            startImageUpload(view, attrs.src)
            view.focus()
          }
        })
      }
    })
  }

  function startImageUpload(view, file) {
    // A fresh object to act as the ID for this upload
    let id = {}

    // Replace the selection with a placeholder
    let tr = view.state.tr
    if (!tr.selection.empty) {
      tr.deleteSelection()
    }
    tr.setMeta(placeholderPlugin, {add: {id, pos: tr.selection.from, file}})
    view.dispatch(tr)

    file.arrayBuffer().then((buffer) => {
      uploadImage(buffer, file.name.split('.').pop(), (e, {url, imageId}) => {
        if (e) {
          return view.dispatch(
            tr.setMeta(placeholderPlugin, {remove: {id}}).setMeta(imageIdPlugin, {add: {imageId}})
          )
        }
        let pos = findPlaceholder(view.state, id)
        // If the content around the placeholder has been deleted, drop
        // the image
        if (pos == null) {
          return
        }
        // Otherwise, insert it at the placeholder's position, and remove
        // the placeholder
        view.dispatch(
          view.state.tr
          .replaceWith(pos, pos, view.state.schema.nodes.image.create({src: url}))
          .setMeta(placeholderPlugin, {remove: {id}})
          .setMeta(imageIdPlugin, {add: {imageId}})
        )
        view.focus()
      })
    })
  }

  function findPlaceholder(state, id) {
    let decos = placeholderPlugin.getState(state)
    let found = decos.find(null, null, spec => spec.id == id)
    return found.length ? found[0].from : null
  }

  let plugins = [
    placeholderPlugin,
    buildInputRules(prosemirror.schema),
    prosemirror.keymap(buildKeymap(prosemirror.schema)),
    prosemirror.keymap(prosemirror.baseKeymap),
    prosemirror.dropCursor(),
    prosemirror.gapCursor(),
    imageIdPlugin,
    prosemirror.history(),
    prosemirror.menuBar(
      {
        floating: true, 
        content: buildMenuItems({schema: prosemirror.schema, insertImageItem}).fullMenu
      }
    ),
  ]
  const initState = initialState ? prosemirror.EditorState.fromJSON(
    {
      schema: prosemirror.schema,
      plugins
    }, _.isString(initialState) ? JSON.parse(initialState) : initialState, statePluginFields
  ) : prosemirror.EditorState.create({
    doc: prosemirror.defaultMarkdownParser.parse(initialMarkdownText),
    plugins,
  })
  // Load editor view
  const view = new prosemirror.EditorView(container, {
    // Set initial state
    state: initState,
    dispatchTransaction(tr) {
      const { state } = view.state.applyTransaction(tr)
      view.updateState(state)
      if (tr.docChanged) {
        onChange({
          imageIds: imageIdPlugin.getState(state),
          editorState: serializeState(),
          content: prosemirror.defaultMarkdownSerializer.serialize(tr.doc),
        })
      }
    },
  })

  function serializeState() {
    return view.state.toJSON(statePluginFields)
  }

  return {
    view,
    plugins,
  }
}
