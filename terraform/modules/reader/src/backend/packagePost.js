const _ = require('lodash')
const archiver = require('archiver')
const streamBuffers = require('stream-buffers')

const packagePostAccessSchema = {
  dataSource: 'GENERIC_FUNCTION',
  namespaceDetails: {
    name: 'PostPackager',
    paramDriven: true,
    parallel: true,
  },
  name: 'PackagePost',
  requiredParams: {
    images: {},
    postText: {},
    postId: {},
    imageRoot: {},
  },
  params: {
    apiConfig: {
      apiObject: packagePost,
    },
  }
};

function packagePost({images, postText, postId, imageRoot}, callback) {
  const outputBuffer = new streamBuffers.WritableStreamBuffer()
  const archive = archiver('zip')
  archive.pipe(outputBuffer)
  archive.on('error', (err) => {
    console.log(err)
    return callback(err)
  })
  outputBuffer.on('finish', () => {
    callback(null, outputBuffer.getContents())
  })

  const amendedText = postText.replace(new RegExp(imageRoot, 'g'), './img/')

  archive.append(amendedText, {name: `${postId}.md`})

  _.map(images, (buf, k) => {
    archive.append(buf, {name: `img/${k}`})
  })
  archive.finalize()
}

module.exports = {
  packagePost,
  packagePostAccessSchema
}
