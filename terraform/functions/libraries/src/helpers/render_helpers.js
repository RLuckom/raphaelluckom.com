const _ = require('lodash')
const yaml = require('js-yaml')
const moment = require('moment')
const hljs = require('highlight.js');
const urlTemplate = require('url-template')
const { Feed } = require('feed')

const mdr = require('markdown-it')({
  html: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }
    return ''; // use external default escaping
  }
}).use(require('markdown-it-footnote'))

function unwrap(params) { 
  return _.reduce(params, (a, v, k) => {
    a[k] = v[0]
    return a
  }, {})
}

function unwrapHttpResponse(params) {
  return _.reduce(unwrap(params), (a, v, k) => {
    a[k] = v.body
    return a
  }, {})
}

function unwrapJsonHttpResponse(params) {
  return _.reduce(unwrap(params), (a, v, k) => {
    a[k] = JSON.parse(v.body)
    return a
  }, {})
}

function unwrapFunctionPayload(params) {
  return _.reduce(unwrap(params), (a, v, k) => {
    a[k] = JSON.parse(v.Payload)
    return a
  }, {})
}

function firstKey(params) {
  return params[_.keys(params)[0]]
}

function unwrapHttpResponseArray(params) {
  return _.reduce(params, (a, v, k) => {
    a[k] = _.map(v, 'body')
    return a
  }, {})
}

function unwrapJsonHttpResponseArray(params) {
  return _.reduce(params, (a, v, k) => {
    a[k] = _.map(v, (i) => JSON.parse(i.body))
    return a
  }, {})
}

function unwrapFunctionPayloadArray(params) {
  return _.reduce(params, (a, v, k) => {
    a[k] = _.map(v, (i) => JSON.parse(i))
    return a
  }, {})
}

function only(f) {
  return function(params) {
    return firstKey(f(params))
  }
}

const formatters = {
  singleValue: {
    unwrap: only(unwrap),
    unwrapHttpResponse: only(unwrapHttpResponse),
    unwrapJsonHttpResponse: only(unwrapJsonHttpResponse),
    unwrapJsonHttpResponseArray: only(unwrapJsonHttpResponseArray),
    unwrapHttpResponseArray: only(unwrapHttpResponseArray),
    unwrapFunctionPayload: only(unwrapFunctionPayload),
    unwrapFunctionPayloadArray: only(unwrapFunctionPayloadArray),
  },
  multiValue: {
    unwrap,
    unwrapHttpResponse,
    unwrapJsonHttpResponse,
    unwrapFunctionPayload,
    unwrapHttpResponseArray,
    unwrapJsonHttpResponseArray,
    unwrapFunctionPayloadArray,
  },
}

//TODO: make this also accept toml, json front matter
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
              path: urlToPath(formatUri, _.get(siteDescription, 'siteDetails.pathRegex'))
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

function renderHTML({siteDetails, item, dependencies}) {
  return _.template(dependencies.template.toString())({ item: { ...dependencies.doc.frontMatter,  ...{content: mdr.render(dependencies.doc.content)}}, meta: dependencies.trails, siteDetails})
}

function renderFeed(feedType, {siteDetails, item, dependencies}) {
  const {doc, accumulators} = dependencies
  const feed = new Feed({
    title: `${item.name} ${item.type}`,
    description: item.description || "",
    id: item.formatUrls[feedType].uri,
    link: item.formatUrls['html'].uri,
    language: "en",
    image: item.image || '',
    favicon: item.favicon || '',
    copyright: "CC-BY-NC-SA Raphael Luckom, 2020",
    feedLinks: {
      json: item.formatUrls['json1.0'].uri,
      rss: item.formatUrls['rss2.0'].uri,
      atom: item.formatUrls['atom1.0'].uri
    },
    author: {
      name: "Raphael Luckom",
      email: "raphaelluckom@gmail.com",
      link: "https://raphaelluckom.com"
    }
  })
  _.each(accumulators.members, (member) => {
    const feedItem = {
      title: _.get(member, 'memberMetadata.frontMatter.title'),
      date: moment(_.get(member, 'memberMetadata.frontMatter.date')).toDate(),
      description: _.get(member, 'memberMetadata.raw'),
      content: _.get(member, 'memberMetadata.raw'),
      id: _.get(member, 'memberUri'),
      link: _.get(member, 'memberUri'),
      author: [{
        name: "Raphael Luckom",
        email: "raphaelluckom@gmail.com",
        link: "https://raphaelluckom.com",
      }],
      contributor: [],
      image: '',
    }
    console.log(feedItem)
    if (feedItem.title) {
      feed.addItem(feedItem)
    }
  })
  if (feedType === 'rss2.0') {
    return feed.rss2()
  } else if (feedType === 'atom1.0' ) {
    return feed.atom1()
  } else if (feedType === 'json1.0' ) {
    return feed.json1()
  }
  return ''
}

const renderers = {
  html: {
    renderFunction: renderHTML,
    ContentType: 'text/html; charset=utf-8',
  },
  'rss2.0': {
    renderFunction: _.partial(renderFeed, 'rss2.0'),
    ContentType: 'application/rss+xml; charset=utf-8',
  },
  'atom1.0': {
    renderFunction: _.partial(renderFeed, 'atom1.0'),
    ContentType: 'application/atom+xml; charset=utf-8',
  },
  'json1.0': {
    renderFunction: _.partial(renderFeed, 'json1.0'),
    ContentType: 'application/json; charset=utf-8',
  },
}

function render({siteDetails, item, dependencies}) {
  const targetFormats = item.typeDef.formats
  const renderedFormats = {
    content: [],
    path: [],
    ContentType: []
  }
  _.each(targetFormats, ({authoring, idTemplate}, formatName) => {
    // never overwrite an authoring format
    if (!authoring) {
      try {
        const url = expandUrlTemplateWithName({templateString: idTemplate, siteDetails, name: item.name})
        const path = urlToPath(url, siteDetails.pathRegex)
        const content = renderers[formatName].renderFunction({siteDetails, item, dependencies})
        renderedFormats.content.push(content)
        renderedFormats.path.push(path)
        renderedFormats.ContentType.push(renderers[formatName].ContentType)
      } catch(e) {
        console.error(e)
      }
    }
  })
  return renderedFormats
}

function expandUrlTemplate({templateString, templateParams}) {
  return urlTemplate.parse(templateString).expand(templateParams)
}

function expandUrlTemplateWithNames({templateString, siteDetails, names}) {
  const template = urlTemplate.parse(templateString)
  return _.map(names, (v, k) => {
    return template.expand({...siteDetails, ...{name: encodeURIComponent(v)}})
  })
}

function expandUrlTemplatesWithName({templateStrings, siteDetails, name}) {
  return _.map(templateStrings, (templateString, k) => {
    const template = urlTemplate.parse(templateString)
    return template.expand({...siteDetails, ...{name: encodeURIComponent(name)}})
  })
}

function expandUrlTemplateWithName({templateString, siteDetails, name, type}) {
  const params = {...siteDetails, ...{name: encodeURIComponent(name)}}
  if (type) {
    params.type = encodeURIComponent(type)
  }
  return urlTemplate.parse(templateString).expand(params)
}

function accumulatorUrls({siteDetails, item}) {
  return _.reduce(item.typeDef.accumulators, (a, {idTemplate}, type) => {
    a.urls.push( expandUrlTemplateWithName({templateString: idTemplate, siteDetails, name: item.name}))
    a.types.push(type)
    return a
  }, {urls: [], types: []})
}

function objectBuilder({keys, preformatter, defaultValue}) {
  try { 
    return (array) => {
      if (_.isFunction(preformatter)) {
        array = preformatter(array)
      }
      return _.zipObject(keys, array)
    }
  } catch(e) {
    if (defaultValue) {
      return defaultValue
    }
    throw e
  }
}

function siteDescriptionDependency(domainName, siteDescriptionPath) {
  return {
    action: 'exploranda',
    formatter: formatters.singleValue.unwrapHttpResponse,
    params: {
      accessSchema: {
        value: {
          dataSource: 'GENERIC_API',
          host: domainName,
          path: siteDescriptionPath,
        }
      },
    },
  }
}

module.exports = {
  formatters,
  accumulatorUrls,
  siteDescriptionDependency,
  expandUrlTemplateWithNames,
  expandUrlTemplatesWithName,
  expandUrlTemplateWithName,
  objectBuilder,
  parsePost,
  identifyItem,
  render,
  expandUrlTemplate,
}
