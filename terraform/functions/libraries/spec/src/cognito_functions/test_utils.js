const rewire = require('rewire')
const _ = require('lodash')
const { createHmac, createHash } = require("crypto")
const raphlogger = require('raphlogger')
const shared = rewire('../../../src/cognito_functions/shared/shared')
const setCookieParser = require('set-cookie-parser')
const fs = require('fs')
const http = require('http');
const { default: parseJwk } = require('jose/jwk/parse')
const { default: SignJWT } = require('jose/jwt/sign')

async function getKeySets() {
  const pubKeySetJson = fs.readFileSync(`${__dirname}/testPubKeySet.json`).toString()
  const privKeySetJson = fs.readFileSync(`${__dirname}/testPrivKeySet.json`).toString()
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
    pubKeySetJson,
    privKeySetJson,
    pubKeySet,
    privKeySet
  }
}

async function startTestOauthServer() {
  const { pubKeySet, privKeySet, pubKeySetJson, privKeySetJson } = await getKeySets()
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
    http.get(defaultConfig.tokenJwksUri, (res) => {
      console.log('\n\n\n')
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          resolve()
        } catch (e) {
          console.error(e.message);
          reject()
        }
      });
    })
  })
  return { pubKeySet, privKeySet, pubKeySetJson, privKeySetJson }
}

function buildCookieString(cookieObject) {
  return Object.entries(cookieObject).map(([k, v]) => `${k}=${v}`).join("; ")
}

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
  }
}

let defaultConfig = {
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
  return {...defaultConfig, ...{
    logger: raphlogger.init(null, {
      source: defaultConfig.source,
      level: defaultConfig.logLevel,
      sourceInstance: defaultConfig.sourceInstance,
      component: defaultConfig.component,
      asyncOutput: false
    })
  }}
})

const intendedResourceHostname = "intended-resource-url.net"

function getUnauthEvent() {
  return {
    "Records": [
      {
        "cf": {
          "config": {
            "distributionId": "EXAMPLE"
          },
          "request": {
            "uri": "/test",
            "method": "GET",
            "headers": {
              "host": [
                {
                  "key": "Host",
                  "value": intendedResourceHostname
                }
              ]
            }
          }
        }
      }
    ]
  }
}

async function getAuthedEvent() {
  const { privKeySet } = await getKeySets()
  return {
    "Records": [
      {
        "cf": {
          "config": {
            "distributionId": "EXAMPLE"
          },
          "request": {
            "uri": "/test",
            "method": "GET",
            "headers": {
              "host": [
                {
                  "key": "Host",
                  "value": intendedResourceHostname
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
}

function secureCookieValue(c) {
  expect(c.path).toBe('/')
  expect(c.secure).toBe(true)
  expect(c.httpOnly).toBe(true)
  expect(c.sameSite).toBe('Strict')
  return c.value
}


function validateRedirectToLogin(req, response) {
  const config = shared.getCompleteConfig()
  
  // Make sure the response is a redirect
  expect(response.status).toBe('307')

  // ensure there's one location header and it points at the auth domain
  expect(_.get(response, 'headers.location').length).toEqual(1)
  const locationHeader = new URL(response.headers.location[0].value)
  expect(locationHeader.origin).toEqual(`https://${config.cognitoAuthDomain}`)
  // Get the querystring arguments forwarded to the auth domain
  const queryParams = locationHeader.searchParams
  // make sure we're telling cognito to send the browser and authz code
  // back to the /parseauth endpoint, which completes the login
  expect(queryParams.get('redirect_uri')).toEqual(`https://${intendedResourceHostname}${config.redirectPathSignIn}`)

  // Make sure we're asking for an authorization code back
  expect(queryParams.get('response_type')).toEqual('code')

  // The pkce challenge value we will be sending is the sha256 of the
  // proof-key we generated (and which we'll be sending back to the
  // browser for storage in a cookie)
  expect(queryParams.get('code_challenge_method')).toEqual('S256')

  // ensure we're asking for the scopes present in the config
  expect(queryParams.get('scope')).toEqual(defaultConfig.oauthScopes.join(' '))
  
  // ensure we're using the client ID from the config
  expect(queryParams.get('client_id')).toEqual(defaultConfig.clientId)

  // Now we validate the cookies and their relationship to the state
  // & challenge
  const setCookies = setCookieParser.parse(_.map(response.headers['set-cookie'], 'value'))

  // we should be setting three cookies; next we check the value of each
  expect(setCookies.length).toEqual(3)
  const cookies = _.reduce(setCookies, (acc, v) => {
    // as we get the value for each set-cookie header, verify that good security is set
    acc[v.name] = secureCookieValue(v)
    return acc
  }, {})
  // Expect that the pkce challenge is the hash of the pkce set in the browser by the set-cookie header
  const challenge = queryParams.get('code_challenge')
  // the round-trip stringify / parse is because the round-trip strips trailing '=' characters
  expect(shared.urlSafe.parse(shared.urlSafe.stringify(createHash("sha256").update(cookies['spa-auth-edge-pkce'], "utf8").digest("base64")))).toBe(shared.urlSafe.parse(challenge))

  // Next we decode the 'state' parameter, which consists of 
  // the nonce we generated and the original URL requested by the browser
  const parsedState = JSON.parse(Buffer.from(shared.urlSafe.parse(queryParams.get('state')), 'base64').toString('utf8'))

  // Check that the final redirect URI matches the initial request
  expect(parsedState.requestedUri).toBe(req.Records[0].cf.request.uri)

  // Make sure the nonce in the state is the same as the one we 
  // are going to store in the browser
  expect(parsedState.nonce).toBe(cookies["spa-auth-edge-nonce"])

  // And finally, check that the hmac we're setting in the browser is
  // correctly the digest of the nonce using the signing secret
  expect(
    shared.urlSafe.parse(shared.urlSafe.stringify(
      createHmac("sha256", defaultConfig.nonceSigningSecret)
      .update(parsedState.nonce)
      .digest("base64")
      .slice(0, config.nonceLength)))
  ).toBe(
  shared.urlSafe.parse(cookies['spa-auth-edge-nonce-hmac'])
  )
}

function validateValidAuthPassthrough(response) {
  console.log(JSON.stringify(response, null, 2))
}

module.exports = { getAuthedEvent, getUnauthEvent, getKeySets, buildCookieString, generateSignedToken, generateIdToken, generateAccessToken, generateRefreshToken, generateValidSecurityCookieValues, defaultConfig, shared, startTestOauthServer, validateRedirectToLogin, validateValidAuthPassthrough}
