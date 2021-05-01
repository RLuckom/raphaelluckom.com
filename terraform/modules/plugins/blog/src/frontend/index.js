goph = buildGopher({
  awsDependencies: {
    listHostingRoot: listHostingRootDependency,
    putImage: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Body: {
          input: 'buffer',
          formatter: ({buffer}) => {
            return buffer
          }
        },
        Bucket: {value: CONFIG.private_storage_bucket },
        Key: { 
          input: 'putPath',
          formatter: ({putPath}) => {
            return putPath
          }
        },
      }
    },
  },
  otherDependencies: {
    dummy: pluginRelativeApiDependency("post-entry"),
    pollImage: {
      accessSchema: {
        name: 'GET url',
        dataSource: 'GENERIC_API',
        value: {path:  _.identity},
      },
      params: {
        apiConfig: {
          input: 'url',
          formatter: ({url}) => {
            return {
              method: 'HEAD',
              url
            }
          },
        },
        dependency: {
          source: 'putImage',
          formatter: _.identity
        }
      },
      behaviors: {
        retryParams: {
          errorFilter: (err) => {
            return err === 404
          },
          times: 10,
          interval: (n) => n * 1000
        },
        detectErrors: (err, res) => {
          if (err) {
            return 404
          }
        }
      }
    }
  },
})

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
      const fm = yaml.safeLoad(frontMatter)
      if (fm.date) {
        fm.date = moment(fm.date)
      }
      return { frontMatter: fm, content, raw:s }
    } catch(e) {
      return { raw: s} 
    }
  } else {
    return { raw: s }
  }
}

// https://gist.github.com/mbrehin/05c0d41a7e50eef7f95711e237502c85
// script to replace <textarea> elements in forms with prosemirror editors 
// ( if they have the .prosemirror class ) 
function initEditors() {
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

  function uploadImage(buffer, ext, callback) {
    const rawName = uuid.v4()
    const canonicalExt = canonicalImageTypes[_.toLower(ext)]
    if (!canonicalExt) {
      throw new Error("unsupported image type")
    }
    const putPath = CONFIG.private_storage_image_upload_path + rawName
    const getUrl = `https://${CONFIG.domain}/${CONFIG.plugin_image_hosting_path}${rawName}/500.${canonicalExt}`
    goph.report(
      'pollImage',
      {
        putPath,
        url: getUrl,
        buffer,
      },
      (e, r) => {
        callback(e, {
          url: getUrl,
          imageId: rawName
        })
      }
    )
  }
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
    const { view, plugins } = prosemirrorView(area, container, uploadImage)
  }
}

document.addEventListener('DOMContentLoaded', initEditors)
