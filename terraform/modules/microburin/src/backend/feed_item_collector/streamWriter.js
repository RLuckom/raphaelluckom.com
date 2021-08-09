const _ = require('lodash')

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

function signToken({payload, signingKeyObject}, callback) {
}

module.exports = {
  signToken,
  signTokenAccessSchema,
}
