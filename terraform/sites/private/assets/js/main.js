function isString(s) {
  return typeof s === 'string'
}

function isNumber(n) {
  return typeof n === 'number'
}

function isArray(a) {
  return Array.isArray(a)
}

function isObject(o) {
  return o && (typeof o === 'object')
}

function isBoolean(b) {
  return b === true || b === false
}

function isNull(n) {
  return !n && typeof n === 'object'
}

function isUndefined(u) {
  return u === undefined
}

function isFunction(f) {
  return typeof f === 'function'
}

function concat(...arrays) {
  return [].concat(...arrays)
}

function get(o, p, fallback) {
  if (isUndefined(o) || isNull(o)) {
    if ((isString(p) || isArray(p)) && p.length) {
      return fallback || null
    } else {
      return o
    }
  }
  if (isArray(p)) {
    if (p.length) {
      return get(o[p.pop()], p)
    } else {
      return o
    }
  } else if (isString(p)) {
    return get(o, stringToPropArray(p))
  }
}

function stringToPropArray(s) {
  const result = []
  let current = ''
  for (l of s) {
    if (l === '.' || l === '[') {
      result.push(current)
      current = ''
    } else if (l === ']') {
      if (isNaN(current)) {
        result.push(current)
        current = ''
      } else {
        result.push(+current)
        current = ''
      }
    } else {
      current += l
    }
  }
  if (current) {
    result.push(current)
  }
  return result
}

function reduce(collection, f, acc) {
  if (!collection) {
    return acc
  }
  if (isArray(collection)) {
    for (let indx = 0; indx < collection.length; indx++) {
      const currentVal = collection[indx]
      acc = f(acc, currentVal, indx)
    }
  } else if (isObject(collection)) {
    for (const prop in collection) {
      const currentVal = collection[prop]
      acc = f(acc, currentVal, prop)
    }
  }
  return acc
}

function each(collection, f) {
  map(collection, f)
}

function map(collection, f) {
  const acc = []
  if (isArray(collection)) {
    for (let k=0; k < collection.length; k++) {
      acc.push(f(collection[k], k))
    }
  } else if (isObject(collection)) {
    for (k in collection) {
      acc.push(f(collection[k], k))
    }
  }
  return acc
}

function series(cbList, callback, results) {
  results = results || []
  if (cbList && cbList.length) {
    const current = cbList.shift()
    current((err, res) => {
      results.push(res)
      if (err) {
        return callback(err)
      } else {
        return series(cbList, callback, results)
      }
    })
  } else {
    callback(null, results)
  }
}

function waterfall(cbList, callback, ...args) {
  if (cbList && cbList.length) {
    const current = cbList.shift()
    current(...args, (err, ...res) => {
      if (err) {
        return callback(err)
      } else {
        return waterfall(cbList, callback, ...res)
      }
    })
  } else {
    callback(null, ...args)
  }
}

function createImgElement(metadata) {
  if (metadata.blob) {
    metadata.src =  window.URL.createObjectURL(metadata.blob)
    delete metadata.blob
  }
  return createGenericElement('img', metadata)
}

function createElement(node) {
  if (!node.type) {
    if (isString(node.data)) {
      return document.createTextNode(node.data)
    }
  }
  const el = document.createElement(node.type)
  if (node.type === 'img') {
    if (get(node, 'metadata.blob')) {
      node.metadata.src =  window.URL.createObjectURL(node.metadata.blob)
      delete node.metadata.blob
    }
  }
  each(get(node, 'metadata'), (v, k) => el.setAttribute(k,  v))
  return el
}

function jsonToDom(node) {
  const domNode = createElement(node)
  for (const child of (node.children || [])) {
    domNode && domNode.appendChild(jsonToDom(child))
  }
  return domNode
}

function constructImagePost(item) {
  const children = []
  children.push({
    type: 'div',
    metadata: {
      class: 'post-date'
    },
    children: [
      {data: new Date(item.timeAddedMs).toLocaleString()}
    ]
  })
  children.push({
    type: 'img', 
    metadata: {
      src: `https:\/\/www.media.raphaelluckom.com/images/${item.mediaId}-1000.JPG`,
      alt: item.alt,
      title: item.alt,
    },
  })
  children.push({
    type: 'div',
    metadata: {
      class: 'image-caption'
    },
    children: [
      {data: item.caption}
    ]
  })
  return {
    type: 'div',
    metadata: {
      class: 'post'
    },
    children,
  }
}

const credentialsAccessSchema = {
  name: 'site AWS credentials',
  value: {path: 'body'},
  dataSource: 'GENERIC_API',
  host: window.location.hostname,
  path: 'api/actions/access/credentials'
}
const apiConfigSelector = {
  source: 'credentials',
  formatter: ({credentials}) => {
    console.log(credentials)
    return {
      region: 'us-east-1',
      accessKeyId: credentials[0].Credentials.AccessKeyId,
      secretAccessKey: credentials[0].Credentials.SecretKey,
      sessionToken: credentials[0].Credentials.SessionToken
    }
  }
}

const athenaQuery = `SELECT *
FROM "prod_rluckom_visibility_data"."raphaelluckom_com"
WHERE year = '2021'
        AND month = '03'
        AND day = '20'
        AND uri LIKE '/posts/%'
        AND method = 'GET'
        AND useragent != '-'
        AND useragent NOT LIKE '%Weavr%'
        AND useragent NOT LIKE '%Faraday%'
        AND useragent NOT LIKE '%jambot.com%'
        AND useragent NOT LIKE '%AndersPinkBot%'
        AND useragent NOT LIKE '%Bytespider%'
        AND useragent NOT LIKE '%LivelapBot%'
        AND useragent NOT LIKE '%Mediatoolkitbot%'
        AND useragent NOT LIKE '%yacybot%'
        AND useragent NOT LIKE '%SerendeputyBot%'
        AND useragent NOT LIKE '%MTRobot%'
        AND useragent NOT LIKE '%DarcyRipper%'
        AND useragent NOT LIKE '%node-fetch%'
        AND useragent NOT LIKE '%ELinks%'
        AND useragent NOT LIKE '%mojeek%'
        AND useragent NOT LIKE '%okhttp%'
        AND useragent NOT LIKE '%Needle%'
        AND useragent NOT LIKE '%Rustbot%'
        AND useragent NOT LIKE '%Semanticbot%'
        AND useragent NOT LIKE '%HubPages%'
        AND useragent NOT LIKE '%Trendsmap%'
        AND useragent NOT LIKE '%crawler@alexa.com%'
        AND useragent NOT LIKE '%techinfo@ubermetrics-technologies.com%'
        AND useragent NOT LIKE '%Anthill%'
        AND useragent NOT LIKE '%linkfluence%'
        AND useragent NOT LIKE '%panscient%'
        AND useragent NOT LIKE '%ahrefs.com%'
        AND useragent NOT LIKE '%netEstate%'
        AND useragent NOT LIKE '%Twitterbot%'
        AND useragent NOT LIKE '%ltx71.com%'
        AND useragent NOT LIKE '%HTTrack%'
        AND useragent NOT LIKE '%NotionEmbedder%'
        AND useragent NOT LIKE '%archive-it%'
        AND useragent NOT LIKE '%Cyotek%'
        AND useragent NOT LIKE '%Synapse%'
        AND useragent NOT LIKE '%MegaIndex%'
        AND useragent NOT LIKE '%Nutch%'
        AND useragent NOT LIKE '%Googlebot%'
        AND useragent NOT LIKE '%bingbot%'
        AND useragent NOT LIKE '%petalbot%'
        AND useragent NOT LIKE '%LightspeedSystemsCrawler%'
        AND useragent NOT LIKE '%CCBot%'
        AND useragent NOT LIKE '%SemrushBot%'
        AND useragent NOT LIKE '%SeznamBot%'
        AND useragent NOT LIKE '%Barkrowler%'
        AND useragent NOT LIKE '%Adsbot%'
        AND useragent NOT LIKE '%MJ12bot%'
        AND useragent NOT LIKE '%Slackbot%'
        AND useragent NOT LIKE '%LinkedInBot%'
        AND useragent NOT LIKE '%yandex%'
        AND useragent NOT LIKE '%webmeup%'
        AND useragent NOT LIKE '%RU_Bot%'
        AND useragent NOT LIKE '%Sogou%'
        AND useragent NOT LIKE '%paper.li%'
        AND useragent NOT LIKE '%PageThing%'
        AND useragent NOT LIKE '%DuckDuckGo-Favicons-Bot%'
        AND useragent NOT LIKE '%komodia%'
        AND useragent NOT LIKE '%discordapp%'
        AND useragent NOT LIKE '%Dataprovider.com%'
ORDER BY  time desc`

const dependencies = {
  credentials: {
    accessSchema: credentialsAccessSchema
  },
  query: {
    accessSchema: exploranda.dataSources.AWS.athena.startQueryExecution,
    params: {
      apiConfig: apiConfigSelector,
      QueryString: {
        value: athenaQuery
      },
      QueryExecutionContext: {
        value: {
          Catalog: 'AwsDataCatalog',
          Database: 'prod_rluckom_visibility_data',
        }
      },
      ResultConfiguration: {
        value: {
          OutputLocation: 's3://rluckom-visibility-data/security_scope=prod/subsystem=prod/source=athena/source=cloudfront/' 
        }
      }
    },
  },
  completion: {
    accessSchema: exploranda.dataSources.AWS.athena.getQueryExecution,
    params: {
      apiConfig: apiConfigSelector,
      QueryExecutionId: { 
        source: 'query',
        formatter: ({query}) => {
          return query[0]
        }
      } 
    },
    behaviors: {
      retryParams: {
        times: 60,
        interval: 10000,
        errorFilter: (err) => {
          return (err === 'QUEUED' || err === 'RUNNING')
        }
      },
      detectErrors: (err, res) => {
        const status = _.get(res, 'QueryExecution.Status.State')
        if (status !== 'SUCCEEDED') {
          console.log(err)
          return status
        }
      }
    },
  },
  results: {
    accessSchema: exploranda.dataSources.AWS.athena.getQueryResults,
    params: {
      apiConfig: apiConfigSelector,
      QueryExecutionId: { 
        source: ['query', 'completion'],
        formatter: ({query}) => {
          return query[0]
        }
      } 
    },
  },
}

exploranda.Gopher(dependencies).report((e, d) => {
  console.log(d.results)
})
