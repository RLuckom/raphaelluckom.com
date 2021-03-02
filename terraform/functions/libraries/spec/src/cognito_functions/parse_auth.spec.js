const rewire = require('rewire')
const parseAuth = rewire('../../../src/cognito_functions/parse_auth.js')
const { setTokenRequestValidator, clearTokenRequestValidator, TOKEN_REQUEST_VALIDATORS, validateRedirectToRequested, setParseAuthDependencies, clearParseAuthDependencies, TOKEN_HANDLERS, setTokenHandler, clearTokenHandler, validParseAuthRequest, getParseAuthDependencies, getDefaultConfig, useCustomConfig, clearCustomConfig, getAuthedEventWithNoRefresh, getCounterfeitAuthedEvent, clearJwkCache, getUnauthEvent, getAuthedEvent, getUnparseableAuthEvent, shared, startTestOauthServer, validateRedirectToLogin, validateValidAuthPassthrough, validateRedirectToRefresh } = require('./test_utils')

function clearConfig() {
  clearCustomConfig()
  parseAuth.__set__('CONFIG', null)
}

describe('cognito parse_auth functions test', () => {
  let resetShared, tokens

  function receiveTokens(t) {
    tokens = t
  }

  beforeAll(async (done) => {
    const testServer = await startTestOauthServer()
    closeServer = testServer.closeServer
    done()
  })

  afterAll((done) => {
    closeServer((e, r) => {
      done()
    })
  })

  beforeEach(() => {
    clearJwkCache()
    clearConfig()
    clearTokenHandler()
    clearParseAuthDependencies()
    clearTokenRequestValidator()
    tokens = null
    resetShared = parseAuth.__set__("shared", shared)
  })

  afterEach(() => {
    resetShared()
  })

  it('redirects a regular authed event back to the intended domain without getting tokens', async (done) => {
    const req = await getAuthedEvent()
    parseAuth.handler(req).then((response) => {
      validateRedirectToRequested(req, response, null, {requestedUri: ''})
      done()
    })
  })

  it('successfully gets tokens, sets them in cookies, and redirects back to the intended uri', async (done) => {
    setTokenHandler(TOKEN_HANDLERS.default, receiveTokens)
    setTokenRequestValidator(TOKEN_REQUEST_VALIDATORS.default)
    const {event, dependencies } = await validParseAuthRequest()
    setParseAuthDependencies(dependencies)
    parseAuth.handler(event).then((response) => {
      validateRedirectToRequested(event, response, tokens, dependencies)
      done()
    })
  })
})
