const _ = require('lodash')
const yaml = require('js-yaml')
const moment = require('moment')
const hljs = require('highlight.js');
const urlTemplate = require('url-template')

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

function identifyItem({resourcePath, siteDescription, selectionPath}) {
  if (!selectionPath) {
    selectionPath = ['relations']
  }
  const pathRegexString = _.get(siteDescription, 'siteDetails.pathRegex')
  const pathRe = new RegExp(pathRegexString)
  if (pathRe.test(resourcePath)) {
    resourcePath = pathRe.exec(resourcePath)[1]
  }
  for (key in _.get(siteDescription, selectionPath)) {
    const reString = _.get(siteDescription, _.concat(selectionPath, [key, 'pathNameRegex']))
    if (key !== 'meta' && reString) {
      const re = new RegExp(reString)
      if (re.test(resourcePath)) {
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
              path: pathRe.exec(formatUri)[1]
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

function renderMarkdown({template, doc, meta}) {
  return _.template(template.toString())({...doc.frontMatter, ...{ content: mdr.render(doc.content), meta}})
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

function expandUrlTemplateWithName({templateString, siteDetails, name, type}) {
  const params = {...siteDetails, ...{name: encodeURIComponent(name)}}
  if (type) {
    params.type = encodeURIComponent(type)
  }
  return urlTemplate.parse(templateString).expand(params)
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
  siteDescriptionDependency,
  expandUrlTemplateWithNames,
  expandUrlTemplateWithName,
  parsePost,
  identifyItem,
  renderMarkdown,
  expandUrlTemplate,
}
