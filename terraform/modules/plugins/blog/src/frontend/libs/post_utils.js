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
    modified: 'Changed locally',
  },
  publishState: {
    mostRecent: 'Published matches most recent saved version',
    unpublished: 'Unpublished',
    modified: 'Saved version differs from published version'
  },
  postActions: {
    unpublish: 'Remove from Blog',
    publish: 'Publish to Blog',
    save: 'Save Without Publishing',
    edit: 'Edit Post',
    delete: 'Delete Post',
    new: 'Write new post'
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
    let frontMatter = ''
    let content = ''
    for (r of t.slice(1)) {
      if (_.trim(r) === '---') {
        if (!started) {
          started = true
        } else {
          content += r + "\n"
        }
      } else {
        if (started) {
          content += r + "\n"
        } else {
          frontMatter += r + '\n'
        }
      }
    }
    try {
      const fm = yaml.load(frontMatter)
      return { frontMatter: fm, content, raw:s }
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
    content: '',
    etag: ''
  }
}

function constructPost({etag, updateDate, date, imageIds, content, author, createDate, title, trails}) {
  return {
    frontMatter: {
      title,
      author,
      createDate: createDate || new Date().toISOString(),
      updateDate: updateDate || new Date().toISOString(),
      date: updateDate || new Date().toISOString(),
      meta: _.cloneDeep({
        trails: trails || [],
        imageIds: imageIds || []
      })
    },
    content: content,
    etag,
  }
}

function postsEqual(p1, p2) {
  const cleanP1 = constructPost({
    imageIds: _.get(p1, 'frontMatter.meta.imageIds'),
    trails: _.get(p1, 'frontMatter.meta.trails'),
    content: _.get(p1, 'content'),
    author: _.get(p1, 'frontMatter.author'),
    title: _.get(p1, 'frontMatter.title'),
    createDate: _.get(p1, 'frontMatter.createDate'),
    updateDate: _.get(p1, 'frontMatter.updateDate'),
    date: _.get(p1, 'frontMatter.date'),
  })
  const cleanP2 = constructPost({
    imageIds: _.get(p2, 'frontMatter.meta.imageIds'),
    trails: _.get(p2, 'frontMatter.meta.trails'),
    content: _.get(p2, 'content'),
    author: _.get(p2, 'frontMatter.author'),
    title: _.get(p2, 'frontMatter.title'),
    createDate: _.get(p2, 'frontMatter.createDate'),
    updateDate: _.get(p2, 'frontMatter.updateDate'),
    date: _.get(p2, 'frontMatter.date'),
  })
  return _.isEqual(cleanP1, cleanP2)
}

function serializePost({frontMatter, content}) {
  return `---\n${yaml.dump(frontMatter)}---\n${content}`
}
