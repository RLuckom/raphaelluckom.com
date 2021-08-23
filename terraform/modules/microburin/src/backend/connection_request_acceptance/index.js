/*
layers:
  - cognito_utils
tests: ../../spec/src/cognito_functions/check_auth.spec.js
*/

const _ = require('lodash')
const { flattenedVerify } = require('jose-node-cjs-runtime/jws/flattened/verify')
const { parseJwk } = require('jose-node-cjs-runtime/jwk/parse')
const { FlattenedVerify } = require('jose-node-cjs-runtime/jws/flattened/verify')
const AXIOS = require('axios')
const AWS = require('aws-sdk')
let dynamo = new AWS.DynamoDB({region: '${dynamo_region}'})
const converter = require('aws-sdk').DynamoDB.Converter

function successResponse(internalMessage, origin, result) {
  writeLog('processed request from [ origin: ' + origin + ' ] [ message: ' + internalMessage + ' ] [ result: ' + result + ' ]')
  return {
    statusCode: 200,
    statusDescription: "OK",
    headers: {
      'content-type': 'text/plain'
    },
  }
}

let TIMEOUT_SECS = parseInt("${key_timeout_secs}") || 1
let INTERMEDIATE_STATE_TIMEOUT = parseInt("${intermediate_connection_state_timeout_secs}") || 60 * 60 * 24 * 14

const STATUS_MESSAGES = {
  noAuth: 'No auth header present',
  unparseableAuth: 'Auth string was not base64-encoded JSON',
  noSig: 'No signature',
  noOrigin: 'No origin',
  badTimestamp: 'Timestamp was not a number',
  futureTimestamp: 'Timestamp was in the future',
  expiredTimestamp: 'Timestamp was too far in the past',
  wrongRecipient: 'Auth was not signed for the correct recipient',
  unrecognizedOrigin: 'origin not found in our connections',
  noSigningKey: 'Could not retrieve signing key within 1s',
  verifyFailed: 'Signature verification failed',
  wrongRequestType: 'Wrong request type',
  getConnectionsFailed: 'Failed to get connections from dynamo',
  insertFailed: 'Failed to insert new connection',
  existingConnection: 'Connection already exists',
  success: 'success',
}

let domain = "${domain}"

const log = "${log}" === "true"

function keyLocation(domain) {
  return "https://" + domain + `/.well-known/microburin-social/keys/social-signing-public-key.jwk`
}

async function getSigningKey(domain) {
  const signingKey = await AXIOS.request({
    method: 'get',
    url: keyLocation(domain),
    timeout: 1000 * TIMEOUT_SECS,
  })
  return signingKey.data
}

function writeLog(s) {
  if (log) {
    console.log(s)
  }
}

const RESULTS = {
  NOOP: 'NOOP',
  CREATE_RECORD: 'CREATE_RECORD'
}

const CONNECTION_REQUEST_RESPONSE = "CONNECTION_REQUEST_RESPONSE"

async function handler(event) {
  const auth = _.get(event, 'headers.microburin-signature', '');
  if (!auth) {
    return successResponse(STATUS_MESSAGES.noAuth, null, RESULTS.NOOP)
  }
  let parsedAuth
  try {
    parsedAuth = JSON.parse(Buffer.from(auth, 'base64').toString('utf8'))
  } catch(e) {
    return successResponse(STATUS_MESSAGES.unparseableAuth, null, RESULTS.NOOP)
  }
  const {sig, timestamp, origin, requestType, recipient} = parsedAuth
  if (!sig) {
    return successResponse(STATUS_MESSAGES.noSig, null, RESULTS.NOOP)
  }
  if (!_.isString(origin)) {
    return successResponse(STATUS_MESSAGES.noOrigin, null, RESULTS.NOOP)
  }
  if (requestType !== CONNECTION_REQUEST_RESPONSE) {
    return successResponse(STATUS_MESSAGES.wrongRequestType, origin, RESULTS.NOOP)
  }
  const { signature, payload, protected } = sig
  if (!_.isNumber(timestamp)) {
    return successResponse(STATUS_MESSAGES.badTimestamp, origin, RESULTS.NOOP)
  }
  const now = new Date().getTime()
  if (timestamp > now) {
    return successResponse(STATUS_MESSAGES.futureTimestamp, origin, RESULTS.NOOP)
  }
  if (now - timestamp > 2000) {
    return successResponse(STATUS_MESSAGES.expiredTimestamp, origin, RESULTS.NOOP)
  }
  if (recipient !== domain) {
    return successResponse(STATUS_MESSAGES.wrongRecipient, origin, RESULTS.NOOP)
  }
  let connections
  try {
    connections = await new Promise((resolve, reject) => {
      dynamo.query({
        TableName: '${dynamo_table_name}',
        ExpressionAttributeNames: {
          '#domKey': '${domain_key}',
        },
        ExpressionAttributeValues: {
          ':status': {
            S: "${connection_status_code_pending}",
          },
          ':dom': {
            S: origin
          }
        },
        KeyConditionExpression: '${connection_state_key} = :status and #domKey = :dom',
      }, (e, r) => {
        if (e) {
          console.log(e)
          return reject(e)
        } else {
          return resolve(_.map(r.Items, (i) => converter.unmarshall(i)))
        }
      })
    })
  } catch(err) {
    return successResponse(STATUS_MESSAGES.getConnectionsFailed, origin, RESULTS.NOOP)
  }
  if (!connections.length) {
    return successResponse(STATUS_MESSAGES.unrecognizedOrigin, origin, RESULTS.NOOP)
  }
  const signedString = Buffer.from(JSON.stringify({timestamp, origin, requestType: CONNECTION_REQUEST_RESPONSE, recipient}), 'utf8').toString('base64').replace(/=*$/g, "")
  let signingKey
  try {
    signingKey = await getSigningKey(origin)
  } catch(e) {
    return successResponse(STATUS_MESSAGES.noSigningKey, origin, RESULTS.NOOP)
  }
  const jws = {
    signature,
    payload,
    protected
  }
  try {
    const k = await parseJwk(signingKey, 'EdDSA')
    await flattenedVerify(jws, k, {algorithms: ["EdDSA"]})
  } catch(e) {
    console.log(e)
    return successResponse(STATUS_MESSAGES.verifyFailed, origin, RESULTS.NOOP)
  }
  writeLog('auth success; writing connection')
  try {
    await new Promise((resolve, reject) => {
      dynamo.putItem({
        TableName: '${dynamo_table_name}',
        Item: converter.marshall({
          "${connection_type_key}" : "${connection_type_initial}",
          "${domain_key}": origin,
          "${connection_state_key}": "${connection_status_code_connected}",
        })
      }, (e, r) => {
        if (e) {
          return reject(e)
        } else {
          return resolve()
        }
      })
    })
  } catch(err) {
    console.log(err)
    return successResponse(STATUS_MESSAGES.insertFailed, origin, RESULTS.NOOP)
  }
  return successResponse(STATUS_MESSAGES.success, origin, RESULTS.CREATE_RECORD)
}

module.exports = {
  handler
}
