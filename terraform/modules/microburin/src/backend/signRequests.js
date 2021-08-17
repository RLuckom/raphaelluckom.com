const _ = require('lodash')
const { parseJwk } = require('jose-node-cjs-runtime/jwk/parse')
const { FlattenedSign } = require('jose-node-cjs-runtime/jws/flattened/sign')

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

async function sign(keyObject, payload) {
  const privateKey = await parseJwk(keyObject, 'EdDSA')
  const sig = await new FlattenedSign(new TextEncoder().encode(JSON.stringify(payload))).setProtectedHeader({alg: 'EdDSA'}).sign(privateKey)
  return sig 
}


function signToken({payload, signingKeyObject}, callback) {
  sign(signingKeyObject, payload).then((sig) => {
    callback(null, _.merge({}, payload, {sig}))
  }).catch((err) => {
    callback(err)
  })
}

module.exports = {
  signToken,
  signTokenAccessSchema,
}
