function getPostUploadKey({postId}) {
  return `${CONFIG.plugin_post_upload_path}${postId}.md`
}

function getPostHostingKey({postId}) {
  return `${CONFIG.plugin_post_hosting_path}${postId}.md`
}

function getImageUploadKey({postId, imageId, ext}) {
  return `${CONFIG.plugin_image_upload_path}${postId}/${imageId}.${ext}`
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

function constructPost({etag, imageIds, content, author, createDate, title, trails}) {
  return {
    frontMatter: {
      title,
      author,
      createDate: createDate || new Date().toISOString(),
      meta: {
        trails: trails || [],
        imageIds: imageIds || []
      }
    },
    content: content,
    etag,
  }
}

function serializePost({frontMatter, content}) {
  return `---\n${yaml.dump(frontMatter)}---\n${content}`
}
