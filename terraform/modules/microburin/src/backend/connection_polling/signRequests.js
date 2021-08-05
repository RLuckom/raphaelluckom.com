const _ = require('lodash')
const { parseJwk } = require('jose-node-cjs-runtime/jwk/parse')
const { FlattenedSign } = require('jose-node-cjs-runtime/jws/flattened/sign')

const parseJwkAccessSchema = {
  dataSource: 'GENERIC_FUNCTION',
  namespaceDetails: {
    name: 'jwkParser',
    paramDriven: true,
    parallel: true,
  },
  name: 'parseJwk',
  requiredParams: {
    keyObject: {},
  },
  params: {
    apiConfig: {
      apiObject: parseKey,
    },
  }
};

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
    signingKey: {},
  },
  params: {
    apiConfig: {
      apiObject: signToken,
    },
  }
};

function signToken({payload: {timestamp, origin, recipient}, signingKey}, callback) {
  new FlattenedSign(new TextEncoder().encode(JSON.stringify({timestamp, origin, recipient}))).setProtectedHeader({alg: 'EdDSA'}).sign(signingKey).then((sig) => {
    callback(null, {timestamp, origin, recipient, sig})
  }).catch((err) => {
    callback(err)
  })
}

function parseKey({keyObject}, callback) {
  parseJwk(keyObject, 'EdDSA').then(key)
    callback(null, key)
  }).catch((err) => {
    callback(err)
  })
}

module.exports = {
  signToken,
  signTokenAccessSchema,
  parseJwk: parseKey,
  parseJwkAccessSchema,
}
