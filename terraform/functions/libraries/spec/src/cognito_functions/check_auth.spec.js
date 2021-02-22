const rewire = require('rewire')
const shared = rewire('../../../src/cognito_functions/shared/shared')
const checkAuth = rewire('../../../src/cognito_functions/check_auth.js')
const raphlogger = require('raphlogger')
const { default: parseJwk } = require('jose/jwk/parse')

let config = {
  "additionalCookies": {},
  "clientId": "hhhhhhhhhhhhhhhhhhhhhhhhhh",
  "clientSecret": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "cognitoAuthDomain": "auth.testcog.raphaelluckom.com",
  "cookieSettings": {
    "accessToken": null,
    "idToken": null,
    "nonce": null,
    "refreshToken": null
  },
  "httpHeaders": {
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; script-src 'self' https://code.jquery.com https://stackpath.bootstrapcdn.com; style-src 'self' 'unsafe-inline' https://stackpath.bootstrapcdn.com; object-src 'none'; connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com",
    "Referrer-Policy": "same-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubdomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block"
  },
  "logLevel": "DEBUG",
  "mode": "StaticSiteMode",
  "nonceSigningSecret": "5DGnV0QPUniayRkx",
  "oauthScopes": [
    "phone",
    "email",
    "profile",
    "openid",
    "aws.cognito.signin.user.admin"
  ],
  "redirectPathAuthRefresh": "/refreshauth",
  "redirectPathSignIn": "/parseauth",
  "redirectPathSignOut": "/",
  "requiredGroup": "test-cognito-pool",
  "userPoolArn":"arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_8G8888888",
  "source": "test",
  "sourceInstance": "test",
  "component": "test",
}

const unauthEvent = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/test",
          "method": "GET",
          "querystring": "foo=bar",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "d123.cf.net"
              }
            ]
          }
        }
      }
    }
  ]
}

shared.__set__("getConfigJson", function() { 
  return {...config, ...{
    logger: raphlogger.init(null, {
      source: config.source,
      level: config.logLevel,
      sourceInstance: config.sourceInstance,
      component: config.component,
      asyncOutput: false
    })
  }}
})

const jwksurl = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_8G8888888/.well-known/jwks.json"

const jwks = {
  "keys": [
    {
      "alg": "RS256",
      "e": "AQAB",
      "kid": "O2IO8VrDQ32VJbzatlWZ+PqkfrQZgVWArrRxJi8jg/w=",
      "kty": "RSA",
      "n": "xliVmZZepCy5mXsmxpLNOu2TD45Hp1BB0wzQYNdri8Y3zpPg2XiSyeDRWWFsC5nXs3jVL6-cqkAWTOcuwMNDwfm3fIYTARHG3rxwNh3Hlszg8hEsu-rOvoijaNAPzDVCqwOn2Oy32gY-LWJ2-Xpondb4RcLkbhKkKbQ211VAjIY5r18YJPKK-Nq_Ulmf3NH92fPz0XAqGm2NZJH2PVU-shACvd5Tmf3lzeF-p4xnpfzHD8Qpkl7FLfpmhUiHk7rdwj_n41q5d6QxLzzceTm6MzVgrE0y-ji39w0TFe_SHDtQgyIKtHKEGeYP9SGaSi0hE1wKDPnWGps0AruEr03_vw",
      "use": "sig"
    },
    {
      "alg": "RS256",
      "e": "AQAB",
      "kid": "0BdFUkDDpigmG4zXhAayYlB1t5DVQF6IsZgDEwW//T8=",
      "kty": "RSA",
      "n": "2S4LRTn-blXjtbuvR-FNPTz0HG73w9vzbbdH7e6UUyGsP-Q5qknzhaMkJ-J1hbFqNDiJyGvWCBXoojh-_N3Xb7HK1ROWsymqkmTg9bbRUD8XKrxjHqqo8faW8tYCsANPa6QlKB29u6z_8u_OUsq0ru91l25PD3uRR6iZZJOPc9NLKrdzux2uCgNeSJZukh9daVwgHriRzNT29Gdw5eQRr48QTZH3ZxqnlnSaD2IttztBoMVnA7WFe0DST5zG_J_ZOpMCB_uXFmU7BCjjg1Xy0_5BDWmy0g7H2dHE_A-Ebp-2ECLzH1ZqIPMO4lvtZRe06M4jCNQOvujGGzBZ-uAeDQ",
      "use": "sig"
    }
  ]
}

// If the thing the fn returns looks like a response, it's sent back to the browser
// as a response. If it still looks like a request, it's forwarded to the origin

describe('cognito check_auth functions test', () => {
  let resetShared

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
    checkAuth.handler(unauthEvent).then((response) => {
      console.log(JSON.stringify(response, null, 2))
      done()
    })
  })

})
