function getPostUploadKey({postId}) {
  return `${CONFIG.plugin_post_upload_path}${postId}.md`
}

function getPostHostingKey({postId}) {
  return `${CONFIG.plugin_post_hosting_path}${postId}.md`
}

function getPostPublicKey({postId}) {
  return `${CONFIG.blog_post_hosting_prefix}${postId}.md`
}

function getImageUploadKey({postId, imageId, imageExt}) {
  return `${CONFIG.plugin_image_upload_path}${postId}/${imageId}.${imageExt}`
}

function getPostDataKey(postId) {
  return `postData?postId=${postId}`
}

function getPostSaveStateDataKey(postId) {
  return `postData?postId=${postId}&field=saveState`
}

function getPostAsSavedDataKey(postId) {
  return `postData?postId=${postId}&field=asSaved`
}

function getPostPublishStateDataKey(postId) {
  return `postData?postId=${postId}&field=publishState`
}

function getPostEditorStateDataKey(postId) {
  return `postData?postId=${postId}&field=editorState`
}

function getPostESaveStateDataKey(postId) {
  return `postData?postId=${postId}&field=saveState`
}

function loadAutosave(postId) {
  const postDataKey = getPostDataKey(postId)
  return getParsedLocalStorageData(postDataKey)
}

function getParsedLocalStorageData(key) {
  const savedData = localStorage.getItem(key)
  if (savedData) {
    const parsed = JSON.parse(savedData)
    return parsed
  }
  return null
}

function updateLocalStorageData(key, updates) {
  const updatedRecord = _.merge({}, getParsedLocalStorageData(key), updates)
  localStorage.setItem(key, JSON.stringify(updatedRecord))
  return updatedRecord
}

function setPostAsSaved(postId, post) {
  const postDataKey = getPostAsSavedDataKey(postId)
  localStorage.setItem(postDataKey, JSON.stringify(post || null))
  return post || null
}

function setPostEditorState(postId, editorState) {
  const postDataKey = getPostEditorStateDataKey(postId)
  localStorage.setItem(postDataKey, JSON.stringify(editorState))
  return editorState
}

function setPostPublishState(postId, state) {
  const postDataKey = getPostPublishStateDataKey(postId)
  localStorage.setItem(postDataKey, JSON.stringify(state))
  return state
}

function setPostSaveState(postId, state) {
  const postDataKey = getPostSaveStateDataKey(postId)
  localStorage.setItem(postDataKey, JSON.stringify(state))
  return state
}

function updatePostAsSaved(postId, post) {
  const postDataKey = getPostAsSavedDataKey(postId)
  return updateLocalStorageData(postDataKey, post)
}

function updatePostEditorState(postId, editorState) {
  const postDataKey = getPostEditorStateDataKey(postId)
  return updateLocalStorageData(postDataKey, editorState)
}

function updatePostPublishState(postId, state) {
  const postDataKey = getPostPublishStateDataKey(postId)
  return updateLocalStorageData(postDataKey, state)
}

function updatePostSaveState(postId, state) {
  const postDataKey = getPostSaveStateDataKey(postId)
  return updateLocalStorageData(postDataKey, state)
}

function getPostAsSaved(postId) {
  const postDataKey = getPostAsSavedDataKey(postId)
  return getParsedLocalStorageData(postDataKey)
}

function getPostEditorState(postId) {
  const postDataKey = getPostEditorStateDataKey(postId)
  return getParsedLocalStorageData(postDataKey)
}

function getPostPublishState(postId) {
  const postDataKey = getPostPublishStateDataKey(postId)
  return getParsedLocalStorageData(postDataKey)
}

function getPostSaveState(postId) {
  const postDataKey = getPostSaveStateDataKey(postId)
  return getParsedLocalStorageData(postDataKey)
}

function deleteLocalState(postId) {
  _.each([
    getPostSaveStateDataKey(postId),
    getPostPublishStateDataKey(postId),
    getPostEditorStateDataKey(postId),
    getPostDataKey(postId),
    getPostAsSavedDataKey(postId),
  ], (k) => {
    localStorage.removeItem(k)
  })
}

const canonicalImageTypes = {
  png: 'png', 
  jpg: 'jpg',
  jpeg: 'jpg',
  tif: 'tif',
  tiff: 'tif',
  webp: 'webp',
  heic: 'heic',
  svg: 'svg',
  gif: 'gif',
}

const translatableText = {
  postMetadata: {
    placeholders: {
      trails: 'Trails (comma-separated)',
      author: 'Author',
      title: 'Title',
      id: "Type a new post id, then press Enter",
    }
  },
  saveState: {
    unmodified: 'Unmodified',
    unsaved: 'Unsaved',
    modified: 'Changed',
  },
  publishState: {
    mostRecent: 'Published',
    unpublished: 'Unpublished',
    modified: 'Changed',
    unknown: 'Unknown',
  },
  postActions: {
    unpublish: 'Unpublish',
    publish: 'Publish',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    toIndex: 'Back',
    new: 'New Post',
    addFootnote: 'Add Footnote',
  },
  editing: 'Editing',
}

function getImagePrivateUrl({postId, imageId, size, ext}) {
  const canonicalExt = canonicalImageTypes[_.toLower(ext)]
  if (!canonicalExt) {
    throw new Error("unsupported image type")
  }
  return `https://${CONFIG.domain}/${CONFIG.plugin_image_hosting_path}${postId}/${imageId}/${size}.${canonicalExt}`
}

function parsePost(s) {
  const t = s.split('\n')
  if (_.trim(t[0]) === '---') {
    let started = false
    let finished = false
    let frontMatter = ''
    let endMatter = ''
    let content = ''
    for (r of t.slice(1)) {
      if (_.trim(r) === '---') {
        if (!started) {
          started = true
        } else {
          content += r + "\n"
        }
      } else if (_.trim(r) === '---END---') {
        finished = true
      } else {
        if (started && !finished) {
          content += r + "\n"
        } else if (!started && !finished) {
          frontMatter += r + '\n'
        } else {
          endMatter += r + '\n'
        }
      }
    }
    try {
      const fm = yaml.load(frontMatter)
      const em = endMatter ? yaml.load(endMatter) : {}
      return { frontMatter: fm, endMatter: em, content, raw:s }
    } catch(e) {
      console.error(e)
      return { raw: s} 
    }
  } else {
    return { raw: s }
  }
}

function newPost() {
  return {
    frontMatter: {
      title: '',
      author: CONFIG.operator_name,
      meta: {
        trails: [],
        imageIds: [],
      },
    },
    endMatter: {
      footnotes: {},
    },
    content: '',
    etag: ''
  }
}

/*
 * Gets the most recent post as saved. 
 * if saved doesn't exist, or if there's a pending edit on the same etag as saved,
 * the edit is merged into the state. Else, the most recent save state is returned.
 * So if you edit on device A, then edit and save on device B, device A will throw out
 * your local edits when it detects the new save state.
 */
function latestKnownPostState(postId) {
  const mergedPost = _.cloneDeep(getPostAsSaved(postId) || newPost())
  const editorState = getPostEditorState(postId)
  if (!!mergedPost.etag || editorState.etag === mergedPost.etag) {
    mergedPost.frontMatter.meta.imageIds = _.cloneDeep(editorState.imageIds)
    mergedPost.frontMatter.meta.trails = _.cloneDeep(editorState.trails)
    mergedPost.frontMatter.title = _.cloneDeep(editorState.title)
    mergedPost.content = _.cloneDeep(editorState.content)
    mergedPost.endMatter = mergedPost.endMatter || {}
    mergedPost.endMatter.footnotes = _.cloneDeep(editorState.footnotes || {})
  }
  mergedPost.endMatter = mergedPost.endMatter || {footnotes: {}}
  return mergedPost
}

function serializePostToMarkdown({frontMatter, content, endMatter}) {
  let text = `---\n${yaml.dump(frontMatter)}---\n${content}\n\n`
  _(endMatter.footnotes).toPairs().sortBy((v) => v[0]).each(([k, v]) => {
    text += `[^${k}]:  ${v.split('\n').join('\n      ')}\n\n`
  })
  console.log(text)
  return text
}

function serializePost({frontMatter, content, endMatter}) {
  return `---\n${yaml.dump(frontMatter)}---\n${content}\n---END---\n${endMatter ? yaml.dump(endMatter) : ''}`
}

function prepareEditorString(s, postId) {
  const postIdInLinkRegex = new RegExp("\\((https:\/\/.*)" + postId + '([^\\)]*)\\)', 'g')
  const postIdInRelativeLinkRegex = new RegExp("]\\(/(.*)" + postId + '([^\\)]*)\\)', 'g')
  return s.replace(postIdInLinkRegex, (match, g1, g2) => "(" + g1 + encodeURIComponent(postId) + g2 + ')').replace(
    postIdInRelativeLinkRegex, (match, g1, g2) => "](/" + g1 + encodeURIComponent(postId) + g2 + ')')
}

function buildFootnoteEditor(postId, footnoteNumber, uploadImage, updateFootnoteMenu) {
  const latestEditorState = getPostEditorState(postId)
  latestEditorState.footnotes = latestEditorState.footnotes || {}
  latestEditorState.footnoteEditorStates = latestEditorState.footnoteEditorStates || {}
  latestEditorState.footnotes[footnoteNumber] = latestEditorState.footnotes[footnoteNumber] || ''
  updateEditorState(postId, {footnotes: latestEditorState.footnotes, footnoteEditorStates: latestEditorState.footnoteEditorStates}, updateFootnoteMenu)
  function onStateChange({imageIds, editorState, content}) {
    const latestEditorState = getPostEditorState(postId)
    latestEditorState.footnotes[footnoteNumber] = content
    latestEditorState.footnoteEditorStates[footnoteNumber] = editorState
    updateEditorState(postId, {footnotes: latestEditorState.footnotes, footnoteEditorStates: latestEditorState.footnoteEditorStates}, updateFootnoteMenu)
    console.log(serializePostToMarkdown(parsePost(serializePost(latestKnownPostState(postId)))))
  }
  const editorDiv = domNode({
    tagName: 'div',
    classNames: ['prosemirror', 'editor'],
  })
  prosemirrorView(editorDiv, uploadImage, _.debounce(_.partial(onStateChange), 2000), latestEditorState.footnoteEditorStates[footnoteNumber], latestEditorState.footnotes[footnoteNumber], [], {})
  return editorDiv
}

function updateEditorState(postId, updates, updateFootnoteMenu, setSaveState) {
  const postAsSaved = getPostAsSaved(postId)
  let isModified = false
  if (updates.title && !_.isEqual(updates.title, _.get(postAsSaved, 'frontMatter.title'))) {
    isModified = true
  }
  if (updates.imageIds && !_.isEqual(updates.imageIds, _.get(postAsSaved, 'frontMatter.meta.imageIds'))) {
    isModified = true
  }
  if (updates.trails && !_.isEqual(updates.trails, _.get(postAsSaved, 'frontMatter.meta.trails'))) {
    isModified = true
  }
  if (updates.content && !_.isEqual(updates.content, _.get(postAsSaved, 'content'))) {
    isModified = true
  }
  if (updates.footnotes && !_.isEqual(updates.footnotes, _.get(postAsSaved, 'endMatter.footnotes'))) {
    updateFootnoteMenu(updates.footnotes)
    isModified = true
  }
  editorState = updatePostEditorState(postId, updates)
  const s = updatePostSaveState(postId, {label: isModified ? translatableText.saveState.modified : translatableText.saveState.unmodified})
  if (_.isFunction(setSaveState)) {
    setSaveState(s.label)
  }
}
