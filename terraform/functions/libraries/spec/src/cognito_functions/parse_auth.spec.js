const rewire = require('rewire')
const shared = rewire('../../../src/cognito_functions/shared/shared')
const parseAuth = rewire('../../../src/cognito_functions/parse_auth.js')
const raphlogger = require('raphlogger')

let config = {
  "additionalCookies": {},
  "clientId": "hhhhhhhhhhhhhhhhhhhhhhhhhh",
  "clientSecret": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "cognitoAuthDomain": "auth.testcog.raphaelluckom.com",
  "cookieCompatibility": "elasticsearch",
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

describe('cognito parse_auth functions test', () => {
  let resetShared

  beforeEach(() => {
    resetShared = parseAuth.__set__("shared", shared)
  })

  afterEach(() => {
    resetShared()
  })

  it('test1', (done) => {
    parseAuth.handler(unauthEvent).then((response) => {
      console.log(JSON.stringify(response, null, 2))
      done()
    })
  })

})
