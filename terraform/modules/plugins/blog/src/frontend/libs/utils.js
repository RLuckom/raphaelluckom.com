const defaultButton = {
  tagName: 'button',
  classNames: 'standard-button',
}

function domNode(el) {
  if (_.isString(el)) {
    return document.createTextNode(el)
  }
  const {innerText, tagName, type, isFor, name, classNames, href, onClick, children} = el
  const newElement = document.createElement(tagName)
  if (_.isArray(classNames)) {
    newElement.className = ' '.join(classNames)
  }
  if (_.isString(classNames)) {
    newElement.className = classNames
  }
  if (tagName === 'label') {
    if (_.isString(isFor)) {
      newElement.for = isFor
    }
  }
  if (tagName === 'input') {
    if (_.isString(type)) {
      newElement.type = type
    }
    if (_.isString(name)) {
      newElement.name = name
    }
  }
  if (tagName === 'a') {
    if (_.isString(href)) {
      newElement.href = href
    }
  }
  if (_.isString(innerText) && !children) {
    newElement.innerText = innerText
  }
  if (_.isFunction(onClick)) {
    newElement.onclick = onClick
  }
  _.each(children, (c) => newElement.appendChild(domNode(c)))
  return newElement
}

function buildGopher({awsDependencies, otherDependencies, defaultInputs}) {
  const tokenRefreshLifetime = 30 * 60 * 1000

  const credentialsAccessSchema = {
    name: 'site AWS credentials',
    value: {path: 'body'},
    dataSource: 'GENERIC_API',
    behaviors: {
      cacheLifetime: tokenRefreshLifetime,
    },
    host: window.location.hostname,
    path: CONFIG.aws_credentials_endpoint
  }

  const apiConfigSelector = {
    source: 'credentials',
    formatter: ({credentials}) => {
      return {
        region: 'us-east-1',
        accessKeyId: credentials[0].Credentials.AccessKeyId,
        secretAccessKey: credentials[0].Credentials.SecretKey,
        sessionToken: credentials[0].Credentials.SessionToken
      }
    }
  }

  const dependencies = _.merge(
    {
      credentials: {
        accessSchema: credentialsAccessSchema,
      }
    },
    _.reduce(awsDependencies, (acc, v, k) => {
      v.params.apiConfig = apiConfigSelector
      acc[k] = v
      return acc
    }, {}),
    otherDependencies || {}
  )

  return exploranda.Gopher(dependencies, defaultInputs)
}

function pluginRelativeApiDependency(pluginRelativePath) {
  return {
    accessSchema: {
      name: `Plugin API: ${pluginRelativePath}`,
      value: {path: 'body'},
      dataSource: 'GENERIC_API',
      host: window.location.hostname,
      path: `${_.trimEnd(CONFIG.api_root, "/")}/${_.trimStart(pluginRelativePath, "?")}`
    }
  }
}

const listHostingRootDependency = {
  accessSchema: exploranda.dataSources.AWS.s3.listObjects,
  params: {
    Bucket: {value: CONFIG.private_storage_bucket },
    Prefix: {value: CONFIG.hosting_root },
  }
}
