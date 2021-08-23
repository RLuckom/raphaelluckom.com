const _ = require('lodash')
const { parseJwk } = require('jose-node-cjs-runtime/jwk/parse')
const { FlattenedSign } = require('jose-node-cjs-runtime/jws/flattened/sign')
const { createHash } = require('crypto');

const signTokenAccessSchema = {
  dataSource: 'GENERIC_FUNCTION',
  namespaceDetails: {
    name: 'RequestSigner',
    paramDriven: true,
    parallel: true,
  },
  name: 'SignRequest',
  requiredParams: {
    payload: {},
    signingKeyObject: {},
  },
  params: {
    apiConfig: {
      apiObject: signToken,
    },
  }
};

async function sign(keyObject, payload, body) {
  const privateKey = await parseJwk(keyObject, 'EdDSA')
  let bodySig = null
  if (body) {
    const hash = createHash('sha256')
    hash.update(body)
    const bodySigPayload = hash.digest('hex')
    bodySig = await new FlattenedSign(new TextEncoder().encode(bodySigPayload)).setProtectedHeader({alg: 'EdDSA'}).sign(keyObject)
  }
  const sig = await new FlattenedSign(new TextEncoder().encode(JSON.stringify({timestamp: payload.timestamp, origin: payload.origin, recipient: payload.recipient, bodySig}))).setProtectedHeader({alg: 'EdDSA'}).sign(privateKey)
  return sig
}

function signToken({payload, body, signingKeyObject}, callback) {
  sign(signingKeyObject, payload, body).then((sig) => {
    callback(null, _.merge({}, payload, {sig}))
  }).catch((err) => {
    callback(err)
  })
}

module.exports = {
  signToken,
  signTokenAccessSchema,
}
