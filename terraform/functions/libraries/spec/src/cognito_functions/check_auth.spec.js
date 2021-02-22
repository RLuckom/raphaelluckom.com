const rewire = require('rewire')
const shared = rewire('../../../src/cognito_functions/shared/shared')
const validateJwt = rewire('../../../src/cognito_functions/shared/validate_jwt')
const jwksClient = require("jwks-rsa")
const checkAuth = rewire('../../../src/cognito_functions/check_auth.js')
const raphlogger = require('raphlogger')
const { default: parseJwk } = require('jose/jwk/parse')
const fs = require('fs')

async function getKeySets() {
  const privKeySet = await JSON.parse(fs.readFileSync(`${__dirname}/testPrivKeySet.json`)).keys.reduce(async (acc, k) => {
    acc[k.kid] = await parseJwk(k)
    return acc
  }, {})
  const pubKeySet = await JSON.parse(fs.readFileSync(`${__dirname}/testPubKeySet.json`)).keys.reduce(async (acc, k) => {
    acc[k.kid] = await parseJwk(k)
    return acc
  }, {})
  return {
    pubKeySet,
    privKeySet
  }
}

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

validateJwt.__set__("jwksClient", function(args) {
  return jwksClient({...args, ...{
    getKeysInterceptor: (cb) => {
      cb(null, pubKeySet.keys)
    }
  }})
})

shared.__set__("validateJwt", validateJwt)
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

shared.__set__("axios", function() { 
  return {
    create: function() {
      return {
      }
    }
  }
})

const jwksurl = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_8G8888888/.well-known/jwks.json"

// If the thing the fn returns looks like a response, it's sent back to the browser
// as a response. If it still looks like a request, it's forwarded to the origin

describe('cognito check_auth functions test', () => {
  let resetShared, pubKeySet, privKeySet

  beforeAll(async () => {
    const keySets = await getKeySets()
    pubKeySet = keySets.pubKeySet
    privKeySet = keySets.privKeySet
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
    checkAuth.handler(unauthEvent).then((response) => {
      console.log(JSON.stringify(response, null, 2))
      done()
    })
  })

})
