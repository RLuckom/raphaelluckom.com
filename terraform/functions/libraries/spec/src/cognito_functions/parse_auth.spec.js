const rewire = require('rewire')
const parseAuth = rewire('../../../src/cognito_functions/parse_auth.js')
const { setParseAuthDependencies, clearParseAuthDependencies, TOKEN_HANDLERS, setTokenHandler, clearTokenHandler, validParseAuthRequest, getParseAuthDependencies, getDefaultConfig, useCustomConfig, clearCustomConfig, getAuthedEventWithNoRefresh, getCounterfeitAuthedEvent, clearJwkCache, getUnauthEvent, getAuthedEvent, getUnparseableAuthEvent, shared, startTestOauthServer, validateRedirectToLogin, validateValidAuthPassthrough, validateRedirectToRefresh } = require('./test_utils')

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
    tokens = null
    resetShared = parseAuth.__set__("shared", shared)
  })

  afterEach(() => {
    resetShared()
  })

  it('unauth', async (done) => {
    const req = await getAuthedEvent()
    parseAuth.handler(req).then((response) => {
      console.log(JSON.stringify(response, null, 2))
      done()
    })
  })

  it('auth', async (done) => {
    setTokenHandler(TOKEN_HANDLERS.default, receiveTokens)
    const {event, dependencies } = await validParseAuthRequest()
    setParseAuthDependencies(dependencies)
    parseAuth.handler(event).then((response) => {
      console.log(JSON.stringify(tokens, null, 2))
      console.log(JSON.stringify(response, null, 2))
      done()
    })
  })
})
