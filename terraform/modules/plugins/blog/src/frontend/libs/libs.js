const { baseKeymap, wrapIn, setBlockType, chainCommands, toggleMark, exitCode, joinUp, joinDown, lift, selectParentNode} = require("prosemirror-commands")
const {dropCursor} = require("prosemirror-dropcursor")
const {gapCursor} = require("prosemirror-gapcursor")
const { Schema } = require("prosemirror-model")
const {history, undo, redo} = require("prosemirror-history")
const {undoInputRule, inputRules, wrappingInputRule, textblockTypeInputRule, smartQuotes, emDash, ellipsis} = require("prosemirror-inputrules")
const {keymap} = require("prosemirror-keymap")
const {menuBar, wrapItem, blockTypeItem, Dropdown, DropdownSubmenu, joinUpItem, liftItem, selectParentNodeItem, undoItem, redoItem, icons, MenuItem} = require("prosemirror-menu")
const {wrapInList, splitListItem, liftListItem, sinkListItem} = require("prosemirror-schema-list")
const { TextSelection, EditorState, Plugin, NodeSelection } = require("prosemirror-state")
const {EditorView, Decoration, DecorationSet} = require("prosemirror-view")
const {defaultMarkdownParser, defaultMarkdownSerializer} = require('prosemirror-markdown')

const uuid = require('uuid')
const yaml = require('js-yaml')
const moment = require('moment')


module.exports = {
  yaml, moment, uuid,
  prosemirror: {
    EditorState, Plugin, NodeSelection, Schema,
    EditorView, Decoration, DecorationSet, TextSelection,
    wrapInList, splitListItem, liftListItem, sinkListItem,
    menuBar, wrapItem, blockTypeItem, Dropdown, DropdownSubmenu, joinUpItem, liftItem, selectParentNodeItem, undoItem, redoItem, icons, MenuItem,
    keymap,
    undoInputRule, inputRules, wrappingInputRule, textblockTypeInputRule, smartQuotes, emDash, ellipsis,
    history, undo, redo,
    gapCursor,
    dropCursor,
    defaultMarkdownParser, defaultMarkdownSerializer, 
    toggleMark, baseKeymap, wrapIn, setBlockType, chainCommands, toggleMark, exitCode, joinUp, joinDown, lift, selectParentNode
  }
}
