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

function request({method, url, headers, body, queryParams, responseType}, callback) {
  const queryString = reduce(queryParams, (acc, v, k) => {
    if (v) {
      const uriEncoded = encodeURIComponent(typeof v === 'string' ? v : JSON.stringify(v))
      if (acc) {
        return acc + `&${k}=${uriEncoded}`
      } else {
        return acc + `?${k}=${uriEncoded}`
      }
    }
    return acc
  },
  '')
  const req = {
    method: method || 'GET', 
    headers,
    body: body && typeof body !== 'string' ? JSON.stringify(body) : body
  }
  fetch(url + queryString, req).then((response) => {
    if (!response.ok) {
      callback(response)
    } else if (responseType && responseType === 'blob') {
      response.blob().then((data) => {
        callback(null, response, data)
      })
    } else {
      response.json().then((data) => {
        callback(null, response, data)
      })
    }
  }).catch((err) => {
    callback(err)
  })
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

fetch(`https://${window.location.hostname}/api/actions/access/credentials`)
.then(response => response.json())
.then(data => console.log(data));
