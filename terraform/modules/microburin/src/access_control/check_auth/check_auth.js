/*
layers:
  - cognito_utils
tests: ../../spec/src/cognito_functions/check_auth.spec.js
*/

const _ = require('lodash')
const { flattenedVerify } = require('jose-node-cjs-runtime/jws/flattened/verify')
const { DynamoDB } = require("@aws-sdk/client-dynamodb");

function accessDeniedResponse(message) {
  return {
    status: "401",
    statusDescription: message || "Access Denied",
    headers: {},
  }
}

const statusMessages = {
  noAuth: 'No auth header present',
  unparseableAuth: 'Auth string was not base64-encoded JSON',
  noSig: 'No signature',
  badTimestamp: 'Timestamp was not a number',
  futureTimestamp: 'Timestamp was in the future',
  expiredTimestamp: 'Timestamp was too far in the past',
  wrongRecipient: 'Auth was not signed for the correct recipient',
  noSigningKey: 'Could not retrieve signing key within 1s',
  verifyFailed: 'Signature verification failed',
}

let CONNECTIONS

let domain = "${domain}"

async function refreshConnections() {
  return []
}

async function handler(event) {
  const request = event.Records[0].cf.request;
  const auth = _.get(request, 'headers.authorization[0].value', '').substr(7);
  if (!auth) {
    return accessDeniedResponse(statusMessages.noAuth)
  }
  let parsedAuth
  try {
    parsedAuth = JSON.parse(Buffer.from(auth, 'base64').toString('utf8'))
  } catch(e) {
    return accessDeniedResponse(statusMessages.unparseableAuth)
  }
  const {sig, timestamp, origin, recipient, protectedHeader} = parsedAuth
  if (!sig || !protectedHeader) {
    return accessDeniedResponse(statusMessages.noSig)
  }
  if (!_.isNumber(timestamp)) {
    return accessDeniedResponse(statusMessages.badTimestamp)
  }
  const now = new Date().getTime()
  if (timestamp > now) {
    return accessDeniedResponse(statusMessages.futureTimestamp)
  }
  if (now - timestamp > 2000) {
    return accessDeniedResponse(statusMessages.expiredTimestamp)
  }
  if (recipient !== domain) {
    return accessDeniedResponse(statusMessages.wrongRecipient)
  }
  const signedString = Buffer.from("" + timestamp + origin + recipient, 'utf8').toString('base64')
  if (!_.isNumber(_.get(CONNECTIONS.timestamp)) || (now - CONNECTIONS.timestamp > 60000)) {
    CONNECTIONS = await refreshConnections()
  }
  if (CONNECTIONS.origins.indexOf(origin) === -1) {
    return accessDeniedResponse(statusMessages.unrecognizedOrigin)
  }
  let signingKey
  try {
    signingKey = await getSigningKey(origin)
  } catch(e) {
    return accessDeniedResponse(statusMessages.noSigningKey)
  }
  const jws = {
    signature: sig,
    payload: signedString,
    protected: protectedHeader
  }
  try {
    await flattenedVerify(jws, signingKey, {algorithms: ["EdDSA"]})
  } catch(e) {
    return accessDeniedResponse(statusMessages.verifyFailed)
  }
  return request
}

module.exports = {
  handler
}
