function domNode(el) {
  if (_.isElement(el)) {
    return el
  }
  if (_.isString(el)) {
    return document.createTextNode(el)
  } else if (_.isArray(el)) {
    return _.map(el, domNode)
  }
  const {id, src, width, height, value, innerText, onKeyDown, onInput, placeholder, onChange, tagName, type, isFor, name, classNames, href, onClick, children} = el
  const newElement = document.createElement(tagName)
  if (_.isArray(classNames)) {
    newElement.className = classNames.join(' ')
  }
  if (_.isString(classNames)) {
    newElement.className = classNames
  }
  if (_.isString(id)) {
    newElement.id = id
  }
  if (tagName === 'img') {
    if (_.isString(src)) {
      newElement.src = src
    }
    if (_.isString(width)) {
      newElement.width = width
    }
    if (_.isString(height)) {
      newElement.height = height
    }
  }
  if (tagName === 'label') {
    if (_.isString(isFor)) {
      newElement.for = isFor
    }
  }
  if (tagName === "button") {
    if (_.isString(name)) {
      newElement.name = name
    }
  }
  if (tagName === 'input') {
    if (_.isFunction(onKeyDown)) {
      newElement.addEventListener('keydown', onKeyDown)
    }
    if (_.isFunction(onInput)) {
      newElement.addEventListener('input', onInput)
    }
    if (_.isString(type)) {
      newElement.type = type
    }
    if (_.isString(placeholder)) {
      newElement.placeholder = placeholder
    }
    if (_.isString(name)) {
      newElement.name = name
    }
    if (value) {
      newElement.value = value
    }
    if (_.isFunction(onChange)) {
      newElement.addEventListener('change', onChange);
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

function buildGopher({awsDependencies, otherDependencies, defaultInputs, render}) {
  const tokenRefreshLifetime = 30 * 60 * 1000
  const renderDomAccessSchema = {
    name: "render dom",
    value: { path: _.constant(1)},
    dataSource: 'SYNTHETIC',
    transformation: (params) => {
      render.init(params, goph)
    }
  }

  const credentialsAccessSchema = {
    name: 'site AWS credentials',
    value: {path: 'body'},
    dataSource: 'GENERIC_API',
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

  const defaultDependencies = {
    credentials: {
      accessSchema: credentialsAccessSchema,
      behaviors: {
        cacheLifetime: tokenRefreshLifetime,
      },
    }
  }

  if (_.isFunction(_.get(render, 'init'))) {
    const renderAccessSchema = _.cloneDeep(renderDomAccessSchema)
    renderAccessSchema.optionalParams = _.reduce(render.params, (acc, v, k) => {
      acc[k] = {
        detectArray: _.get(v, 'detectArray') || _.constant(false)
      }
      return acc
    }, {})
    defaultDependencies.initialRender = {
      accessSchema: renderAccessSchema,
      params: render.params 
    }
  }

  const dependencies = _.merge(
    defaultDependencies,
    _.reduce(awsDependencies, (acc, v, k) => {
      v.params.apiConfig = apiConfigSelector
      acc[k] = v
      return acc
    }, {}),
    otherDependencies || {}
  )

  const goph = exploranda.Gopher(dependencies, defaultInputs)
  if (defaultDependencies.initialRender) {
    goph.report('initialRender', _.get(render, 'inputs'), (e) => {
      if (e) {
        console.log(e)
      }
    })
  }
  return goph
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

document.addEventListener('DOMContentLoaded', () => {
  window.goph = buildGopher(_.merge(window.GOPHER_CONFIG, window.RENDER_CONFIG ? {render: window.RENDER_CONFIG} : {}))
})
