/*
layers:
  - donut_days
*/
const _ = require('lodash')

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

module.exports = {
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
  objectBuilder,
}
