const _ = require('lodash')
const urlTemplate = require('url-template')

function urlToPath(url, pathReString) {
  let resourcePath = url
  const pathRe = new RegExp(pathReString)
  if (pathRe.test(resourcePath)) {
    resourcePath = pathRe.exec(resourcePath)[1]
  }
  return resourcePath
}

function identifyItem({resourcePath, siteDescription, selectionPath}) {
  if (!selectionPath) {
    selectionPath = ['relations']
  }
  resourcePath = urlToPath(resourcePath, _.get(siteDescription, 'siteDetails.pathRegex')) || resourcePath
  console.log(resourcePath)
  for (key in _.get(siteDescription, selectionPath)) {
    const reString = _.get(siteDescription, _.concat(selectionPath, [key, 'pathNameRegex']))
    if (key !== 'meta' && reString) {
      const re = new RegExp(reString)
      if (re.test(resourcePath)) {
        console.log('tested')
        const name = re.exec(resourcePath)[1]
        selectionPath.push(key)
        const typeDef = _.get(siteDescription, selectionPath)
        const uriTemplateArgs = {...siteDescription.siteDetails, ...{name}}
        const formatUrls = _.reduce(_.get(typeDef, 'formats'), (a, v, k) => {
          const uriTemplateString = v.idTemplate
          if (uriTemplateString) {
            const formatUri = urlTemplate.parse(uriTemplateString).expand(uriTemplateArgs)
            a[k] = {
              uri: formatUri,
              path: urlToPath(_.get(siteDescription, 'siteDetails.pathRegex'), formatUri)
            }
          }
          return a
        }, {})
        return {
          type: key,
          typeDef,
          name,
          formatUrls,
          uri: urlTemplate.parse(_.get(siteDescription, _.concat(selectionPath, ['idTemplate']))).expand(uriTemplateArgs),
          path: resourcePath
        }
      }
    }
  }
  if (_.get(siteDescription, _.concat(selectionPath, ['meta']))) {
    selectionPath.push('meta')
    return identifyItem({resourcePath, siteDescription, selectionPath})
  }
}

module.exports = {
  identifyItem,
}
