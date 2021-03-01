const rewire = require('rewire')
const parseAuth = rewire('../../../src/cognito_functions/parse_auth.js')
const { getParseAuthDependencies, getDefaultConfig, useCustomConfig, clearCustomConfig, getAuthedEventWithNoRefresh, getCounterfeitAuthedEvent, clearJwkCache, getUnauthEvent, getAuthedEvent, getUnparseableAuthEvent, shared, startTestOauthServer, validateRedirectToLogin, validateValidAuthPassthrough, validateRedirectToRefresh } = require('./test_utils')

function clearConfig() {
  clearCustomConfig()
  parseAuth.__set__('CONFIG', null)
}

describe('cognito parse_auth functions test', () => {
  let resetShared

  beforeEach(() => {
    clearJwkCache()
    clearConfig()
    resetShared = parseAuth.__set__("shared", shared)
  })

  afterEach(() => {
    resetShared()
  })

  it('test1', async (done) => {
    const deps = await getParseAuthDependencies()
    const req = await getAuthedEvent()
    parseAuth.handler(req).then((response) => {
      console.log(JSON.stringify(response, null, 2))
      done()
    })
  })
})
