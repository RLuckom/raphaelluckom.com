const rewire = require('rewire')
const signOut = rewire('../../../src/cognito_functions/sign_out.js')
const { validateHtmlErrorPage, clearJwkCache, clearCustomConfig, getUnauthEvent, getAuthedEvent, getUnparseableAuthEvent, shared, validateRedirectToLogout } = require('./test_utils')

function clearConfig() {
  clearCustomConfig()
  signOut.__set__('CONFIG', null)
}

describe('when sign_out gets a request', () => {
  let resetShared

  beforeEach(() => {
    clearJwkCache()
    clearConfig()
    resetShared = signOut.__set__("shared", shared)
  })

  afterEach(() => {
    resetShared()
  })

  it('returns an HTML document if there is no token', async (done) => {
    const req = await getUnauthEvent()
    signOut.handler(req).then((response) => {
      validateHtmlErrorPage(req, response)
      done()
    })
  })

  it('returns a redirect to cognito logout and expires cookies if the request is authorized', async (done) => {
    const req = await getAuthedEvent()
    signOut.handler(req).then((response) => {
      validateRedirectToLogout(req, response)
      done()
    })
  })

})
