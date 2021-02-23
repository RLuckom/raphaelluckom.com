const rewire = require('rewire')
const shared = rewire('../../../src/cognito_functions/shared/shared')
const jwksClient = require("jwks-rsa")
const checkAuth = rewire('../../../src/cognito_functions/check_auth.js')
const raphlogger = require('raphlogger')
const { default: parseJwk } = require('jose/jwk/parse')
const { default: SignJWT } = require('jose/jwt/sign')
const fs = require('fs')
const http = require('http');

const pubKeySetJson = fs.readFileSync(`${__dirname}/testPubKeySet.json`).toString()
const privKeySetJson = fs.readFileSync(`${__dirname}/testPrivKeySet.json`).toString()
async function getKeySets() {
  const privKeySet = {}
  const privKeys = JSON.parse(privKeySetJson).keys
  for (let n=0; n < privKeys.length; n++) {
    const key = privKeys[n]
    privKeySet[key.kid] = await parseJwk(key)
  }
  const pubKeySet = {}
  const pubKeys = JSON.parse(pubKeySetJson).keys
  for (let n=0; n < pubKeys.length; n++) {
    const key = pubKeys[n]
    pubKeySet[key.kid] = await parseJwk(key)
  }
  return {
    pubKeySet,
    privKeySet
  }
}

function buildCookieString(cookieObject) {
  return Object.entries(cookieObject).map(([k, v]) => `${k}=${v}`).join("; ")
}

let config = {
  "additionalCookies": {},
  "tokenJwksUri": "http://localhost:8000/.well-known/jwks.json",
  "tokenIssuer": "http://localhost:8000",
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

async function generateSignedToken(config, privKey, kid, claims) {
  return await new SignJWT(claims)
  .setProtectedHeader({ alg: 'RS256', kid })
  .setIssuedAt()
  .setIssuer(config.tokenIssuer)
  .setAudience(config.clientId)
  .setExpirationTime('2h')
  .sign(privKey)
}

async function generateIdToken(config, privKey) {
  return await generateSignedToken(config, privKey, "id", {'id': true, 'cognito:groups': [config.requiredGroup]})
}

async function generateAccessToken(config, privKey) {
  return await generateSignedToken(config, privKey, 'access', {'access': true})
}

async function generateRefreshToken(config, privKey) {
  return await generateSignedToken(config, privKey, 'access', {'refresh': true})
}

async function generateValidSecurityCookieValues(idPrivKey, accessPrivKey, pkce="") {
  const config = shared.getCompleteConfig()
  const nonce = shared.generateNonce(config)
  return {
    "ID-TOKEN": await generateIdToken(config, idPrivKey),
    "ACCESS-TOKEN": await generateAccessToken(config, accessPrivKey),
    "REFRESH-TOKEN": await generateRefreshToken(config, accessPrivKey),
    "spa-auth-edge-nonce": encodeURIComponent(nonce),
    "spa-auth-edge-nonce-hmac": encodeURIComponent(shared.sign(nonce, config.nonceSigningSecret, config.nonceLength)),
    "spa-auth-edge-pkce": encodeURIComponent(pkce)
  }
}

// If the thing the fn returns looks like a response, it's sent back to the browser
// as a response. If it still looks like a request, it's forwarded to the origin

let resetShared, pubKeySet, privKeySet
describe('cognito check_auth functions test', () => {

  beforeAll(async (done) => {
    const keySets = await getKeySets()
    pubKeySet = keySets.pubKeySet
    privKeySet = keySets.privKeySet
    await new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        if (req.method === "GET" && req.url === `/.well-known/jwks.json`) {
          console.log('delivered pubkeys')
          res.setHeader('content-type', 'application/json')
          res.end(pubKeySetJson, 'utf8');
        }
      });
      server.on('clientError', (err, socket) => {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      });
      server.listen(8000, (e, r) => {
        if (e) {
          reject(e)
        }
        resolve(r)
      });
    })
    await new Promise((resolve, reject) => {
      http.get(config.tokenJwksUri, (res) => {
        console.log('\n\n\n')
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            console.log(parsedData);
          } catch (e) {
            console.error(e.message);
          }
          resolve()
          done()
        });
      })
    })
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
    checkAuth.handler(unauthEvent).then((response) => {
      console.log(JSON.stringify(response, null, 2))
      done()
    })
  })

  it('test2', async (done) => {
    console.log(privKeySet)

    const authEvent = {
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
                ],
                "cookie": [
                  {
                    key: "Cookie",
                    value: buildCookieString(await generateValidSecurityCookieValues(privKeySet.id, privKeySet.access))
                  }
                ]
              }
            }
          }
        }
      ]
    }
    checkAuth.handler(authEvent).then((response) => {
      console.log(JSON.stringify(response, null, 2))
      done()
    })
  })

})
