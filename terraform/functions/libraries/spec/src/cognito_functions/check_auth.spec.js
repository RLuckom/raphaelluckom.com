const rewire = require('rewire')
const checkAuth = rewire('../../../src/cognito_functions/check_auth.js')
const { clearJwkCache, getUnauthEvent, getAuthedEvent, getUnparseableAuthEvent, shared, startTestOauthServer, validateRedirectToLogin, validateValidAuthPassthrough } = require('./test_utils')

// If the thing the fn returns looks like a response, it's sent back to the browser
// as a response. If it still looks like a request, it's forwarded to the origin

describe('when check_auth gets a request but the oauth keyserver is unreachable', () => {
  let resetShared

  beforeEach(() => {
    clearJwkCache()
    resetShared = checkAuth.__set__("shared", shared)
  })

  afterEach(() => {
    resetShared()
  })

  it('redirects to login even if the token happens to be valid (because it cant tell)', async (done) => {
    const req = await getAuthedEvent()
    checkAuth.handler(req).then((response) => {
      validateRedirectToLogin(req, response)
      done()
    })
  })
})

describe('when check_auth gets a request', () => {
  let resetShared, closeServer

  beforeAll(async (done) => {
    console.log('starting server')
    const testServer = await startTestOauthServer()
    closeServer = testServer.closeServer
    done()
  })

  afterAll((done) => {
    closeServer((e, r) => {
      console.log(e)
      console.log(r)
      done()
    })
  })

  beforeEach(() => {
    clearJwkCache()
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

  describe("and it IS NOT accompanied by a valid token", () => {
    it('redirects to cognito if no token is present', (done) => {
      const req = getUnauthEvent()
      checkAuth.handler(req).then((response) => {
        validateRedirectToLogin(req, response)
        done()
      })
    })

    it('redirects to cognito if the token is unparseable', async (done) => {
      const req = await getUnparseableAuthEvent()
      checkAuth.handler(req).then((response) => {
        validateRedirectToLogin(req, response)
        done()
      })
    })

    it('redirects to cognito if the issuer is wrong', async (done) => {
      const req = await getAuthedEvent("foobarbaz")
      checkAuth.handler(req).then((response) => {
        validateRedirectToLogin(req, response)
        done()
      })
    })

    it('redirects to cognito if the clientId is wrong', async (done) => {
      const req = await getAuthedEvent(null, "foobarbaz")
      checkAuth.handler(req).then((response) => {
        validateRedirectToLogin(req, response)
        done()
      })
    })

    it('redirects to cognito if the kid doesnt match a kid presented by the server', async (done) => {
      const req = await getAuthedEvent(null, null, null, null, 'wokka')
      checkAuth.handler(req).then((response) => {
        validateRedirectToLogin(req, response)
        done()
      })
    })

    it('redirects to cognito if the token doesnt have the required group', async (done) => {
      const req = await getAuthedEvent(null, null, null, null, null, [])
      checkAuth.handler(req).then((response) => {
        validateRedirectToLogin(req, response)
        done()
      })
    })

    it('redirects to cognito if the token doesnt have the required group', async (done) => {
      const req = await getAuthedEvent(null, null, null, null, null, "nogroups")
      checkAuth.handler(req).then((response) => {
        validateRedirectToLogin(req, response)
        done()
      })
    })
  })

  describe("and it IS accompanied by a valid token", () => {
    it('passes the request through to the backend', async (done) => {
      const req = await getAuthedEvent()
      checkAuth.handler(req).then((response) => {
        validateValidAuthPassthrough(response)
        done()
      })
    })
  })
})
