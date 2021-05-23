const geometryElements = ['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']

function svgNode(el) {
  if (_.isString(el)) {
    return document.createTextNode(el)
  }
  function setIfDefined(attr, node, objName, val, dflt) {
    const toApply = val || el[attr] || el[objName] || dflt
    if (!_.isUndefined(toApply) && !_.isNull(toApply)) {
      node.setAttribute(attr, toApply)
    }
  }
  const tagName = el.tagName
  let newElement
  if (tagName === 'svg') {
    newElement = applyDefaultAttrs(document.createElementNS("http://www.w3.org/2000/svg", tagName), el)
    if (el.viewBox) {
      if (_.isString(el.viewBox)) {
        setIfDefined('viewbox', newElement, 'viewBox')
      } else if (_.isArray(el.viewBox)) {
        setIfDefined('viewbox', newElement, 'viewBox', el.viewBox.join(' '))
      }
    } else {
      newElement.setAttribute('viewbox', '0 0 100 100')
    }
    setIfDefined('height', newElement, 'height', el.height, 100)
    setIfDefined('width', newElement, 'width', el.width, 100)
  } else {
    newElement = applyDefaultAttrs(document.createElementNS("http://www.w3.org/2000/svg", tagName), el)
    setIfDefined('transform', newElement, 'transform')
    setIfDefined('fill', newElement, 'fill', el.fill, 'none')
    setIfDefined('fill-rule', newElement, 'fillRule')
    setIfDefined('fill-opacity', newElement, 'fillOpacity')
    setIfDefined('stroke', newElement, 'stroke')
    setIfDefined('stroke-opacity', newElement, 'strokeOpacity')
    setIfDefined('stroke-width', newElement, 'strokeWidth')
    setIfDefined('stroke-linecap', newElement, 'strokeLinecap')
    setIfDefined('stroke-linejoin', newElement, 'strokeLinejoin')
  }
  if (tagName === 'rect') {
    setIfDefined('x', newElement, 'x')
    setIfDefined('y', newElement, 'y')
    setIfDefined('rx', newElement, 'rx')
    setIfDefined('ry', newElement, 'ry')
  }
  if (tagName === 'circle') {
    setIfDefined('cx', newElement, 'cx')
    setIfDefined('cy', newElement, 'cy')
    setIfDefined('r', newElement, 'r')
  }
  if (tagName === 'ellipse') {
    setIfDefined('cx', newElement, 'cx')
    setIfDefined('cy', newElement, 'cy')
    setIfDefined('rx', newElement, 'rx')
    setIfDefined('ry', newElement, 'ry')
  }
  if (tagName === 'line') {
    setIfDefined('x1', newElement, 'x1')
    setIfDefined('y1', newElement, 'y1')
    setIfDefined('x2', newElement, 'x2')
    setIfDefined('y2', newElement, 'y2')
  }
  if (tagName === 'polyline') {
    setIfDefined('pathLength', newElement, 'pathLength')
    setIfDefined('points', newElement, 'points', serializePoints(el.points))
  }
  if (tagName === 'polygon') {
    setIfDefined('pathLength', newElement, 'pathLength')
    setIfDefined('points', newElement, 'points', serializePoints(el.points))
  }
  if (tagName === 'path') {
    setIfDefined('d', newElement, 'd')
  }
  if (tagName === 'text') {
    setIfDefined('x', newElement, 'x')
    setIfDefined('y', newElement, 'y')
    setIfDefined('dx', newElement, 'dx')
    setIfDefined('dy', newElement, 'dy')
    setIfDefined('rotate', newElement, 'rotate')
    setIfDefined('textLength', newElement, 'textLength')
  }
  if (tagName === 'tspan') {
    setIfDefined('x', newElement, 'x')
    setIfDefined('y', newElement, 'y')
    setIfDefined('dx', newElement, 'dx')
    setIfDefined('dy', newElement, 'dy')
    setIfDefined('rotate', newElement, 'rotate')
    setIfDefined('textLength', newElement, 'textLength')
    setIfDefined('lengthAdjust', newElement, 'textLength')
  }
  if (tagName === 'textPath') {
    setIfDefined('lengthAdjust', newElement, 'lengthAdjust')
    setIfDefined('textLength', newElement, 'textLength')
    setIfDefined('path', newElement, 'path')
    setIfDefined('href', newElement, 'href')
    setIfDefined('startOffset', newElement, 'startOffset')
    setIfDefined('method', newElement, 'method')
    setIfDefined('spacing', newElement, 'spacing')
    setIfDefined('side', newElement, 'side')
  }
  _.each(el.children, (c) => newElement.appendChild(svgNode(c)))
  return newElement
}

function serializePoints(points) {
  if (!points || _.isString(points)) {
    return points
  }
  if (_.isArray(points) && points.length > 0) {
    if (_.isArray(points[0])) {
      return _.reduce(points, (acc, [x, y]) => {
        return acc + ` ${x},${y} `
      }, '')
    } else if (_.isNumber(points[0])) {
      let acc = ''
      while (points.length) {
        const x = points.shift()
        const y = points.shift()
        acc += ` ${x},${y} `
      }
      return acc
    } else if (_.isPlainObject(points[0])) {
      let acc = ''
      while (points.length) {
        const {x , y} = points.shift()
        acc += ` ${x},${y} `
      }
      return acc
    }
  }
}

function applyDefaultAttrs(node, el) {
  const {onClick, id, style, dataset, width, height, classNames} = el
  if (_.isArray(classNames)) {
    node.className = classNames.join(' ')
  }
  if (_.isString(classNames)) {
    node.className = classNames
  }
  if (dataset) {
    if (_.isPlainObject(dataset)) {
      _.each(dataset, (v, k) => {
        node.dataset[k] = v
      })
    }
  }
  if (_.isString(id)) {
    node.id = id
  }
  if (_.isFunction(onClick)) {
    node.onclick = onClick
  }
  _.each(style, (v, k) => {
    node.style[k] = v
  })
  return node
} 

function domNode(el) {
  if (_.isElement(el)) {
    return el
  }
  if (_.isString(el)) {
    return document.createTextNode(el)
  } else if (_.isArray(el)) {
    return _.map(el, domNode)
  }
  const {span, onKeyUp, src, value, innerText, onKeyDown, onInput, placeholder, onChange, tagName, type, isFor, name, href, onClick, children} = el
  if (tagName === 'svg') {
    return svgNode(el)
  }
  const newElement = applyDefaultAttrs(document.createElement(tagName), el)
  if (tagName === "col") {
    if (span) {
      newElement.span = span
    }
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
    if (_.isFunction(onKeyUp)) {
      newElement.addEventListener('keyup', onKeyUp)
    }
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
  _.each(children, (c) => newElement.appendChild(domNode(c)))
  return newElement
}

function domNodes(...args) {
  return _.map(args, domNode)
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
  const originalReport = _.bind(goph.report, goph)
  const errHandler = _.isFunction(_.get(render, 'onAPIError')) ? _.get(render, 'onAPIError') : (e, r, originalCallback) => {
    console.error(e)
  }
  goph.report = (...args) => {
    const originalCallback = _.isFunction(args[args.length - 1]) ? args[args.length - 1] : null
    if (originalCallback) {
      const newCallback = (e, r) => {
        if (e) {
          errHandler(e, r, originalCallback)
        } else {
          originalCallback(e, r)
        }
      }
      args.splice(args.length - 1, 1, newCallback)
      return originalReport(...args)
    } else {
      return originalReport(...args)
    }
  }
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
