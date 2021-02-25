const rewire = require('rewire')
const jwksClient = require("jwks-rsa")
const checkAuth = rewire('../../../src/cognito_functions/check_auth.js')
const { getUnauthEvent, getAuthedEvent, shared, startTestOauthServer, validateRedirectToLogin, validateValidAuthPassthrough } = require('./test_utils')

// If the thing the fn returns looks like a response, it's sent back to the browser
// as a response. If it still looks like a request, it's forwarded to the origin

describe('cognito check_auth functions test', () => {
  let resetShared

  beforeAll(async (done) => {
    await startTestOauthServer()
    done()
  })

  beforeEach(() => {
    resetShared = checkAuth.__set__("shared", shared)
  })

  afterEach(() => {
    resetShared()
  })
  /* Things used by the handler
   * * Config (complete)
   * * cookie headers 
   *     id token (regexed b64 of jwt)
   *     id token expiration ("exp" of decoded jwt)
   *     id token payload cognito:groups
   * * nonce signing secret, nonce length
   * * config clientId
   * * config issuer
   * * JWKS uri (mock this to return jwks)
   * * JWKS
   * * expected group from config
   */

  it('test1', (done) => {
    const req = getUnauthEvent()
    checkAuth.handler(req).then((response) => {
      validateRedirectToLogin(req, response)
      done()
    })
  })

  it('test2', async (done) => {
    const req = await getAuthedEvent()
    checkAuth.handler(req).then((response) => {
      validateValidAuthPassthrough(response)
      done()
    })
  })
})
