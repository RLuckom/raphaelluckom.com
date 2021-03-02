const rewire = require('rewire')
const _ = require('lodash')
const { createHmac, createHash } = require("crypto")
const raphlogger = require('raphlogger')
const shared = rewire('../../../src/cognito_functions/shared/shared')
const validateJwt = rewire('../../../src/cognito_functions/shared/validate_jwt')
const setCookieParser = require('set-cookie-parser')
const qs = require("querystring")
const stringifyQueryString = qs.stringify
const parseQueryString = qs.parse
const fs = require('fs')
const http = require('http');
const { default: parseJwk } = require('jose/jwk/parse')
const { default: SignJWT } = require('jose/jwt/sign')
const { default: generateKeyPair } = require('jose/util/generate_key_pair')

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

function verifyValidTokenRequest(req, body) {
  const config = shared.getCompleteConfig()
  expect(req.headers["content-type"]).toBe("application/x-www-form-urlencoded")
  expect(req.headers["authorization"]).toBe(`Basic aGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGg6YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYQ==`)
  const query = parseQueryString(body)
  expect(query.grant_type).toBe('authorization_code')
  // redirect_uri doesn't really matter to us; since we're getting the token in the response
  // we won't be following it
  expect(query.redirect_uri).toBe('https://intended-resource-url.net/parseauth')
  expect(query.client_id).toBe(config.clientId)
  expect(query.code).toBe(TOKEN_AUTH_CODE)
  expect(query.code_verifier).toBe(_.get(currentDependencies, 'pkce'))
}

function defaultTokenResponse(req, res, body, privKeySet, receiver) {
  verifyValidTokenRequest(req, body)
  return generateValidSecurityCookieValues(privKeySet.id, privKeySet.access).then((tokenCookieValues) => {
    res.setHeader('content-type', 'application/json')
    const tokens = {
      id_token: tokenCookieValues["ID-TOKEN"],
      access_token: tokenCookieValues["ACCESS-TOKEN"],
      refresh_token: tokenCookieValues["REFRESH-TOKEN"],
    }
    res.end(JSON.stringify(tokens), 'utf8');
    if (receiver) {
      receiver(tokenCookieValues)
    }
  })
}

const TOKEN_HANDLERS = {
  default: defaultTokenResponse,
}

let currentTokenHandler = null
let currentTokenReceiver = null
let currentDependencies = null

function setTokenHandler(handler, callback) {
  currentTokenReceiver = callback
  currentTokenHandler = handler
}

function clearTokenHandler() {
  currentTokenHandler = TOKEN_HANDLERS.default
  currentTokenReceiver = null
}

function setParseAuthDependencies(deps) {
  currentDependencies = deps
}

function clearParseAuthDependencies() {
  currentDependencies = null
}

async function startTestOauthServer() {
  const { pubKeySet, privKeySet, pubKeySetJson, privKeySetJson } = await getKeySets()
  let server
  await new Promise(function(resolve, reject) {
    server = http.createServer((req, res) => {
      const chunks = []
      let body
      req.on('data', (chunk) => {
        chunks.push(chunk)
      })
      req.on('end', () => {
        body = Buffer.concat(chunks).toString()
        if (req.method === "GET" && req.url === `/.well-known/jwks.json`) {
          res.setHeader('content-type', 'application/json')
          res.end(pubKeySetJson, 'utf8');
        }
        if (req.method === "POST" && req.url === `/oauth2/token`) {
          currentTokenHandler(req, res, body, privKeySet, currentTokenReceiver)
        } else {
          console.log(req.method)
          console.log(req.url)
        }
      })
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
  async function closeServer(cb) {
    server.close(cb)
  }
  return { closeServer, pubKeySet, privKeySet, pubKeySetJson, privKeySetJson }
}

const TOKEN_AUTH_CODE = 'aaaaaaaaaaaaaaaaaaaaaaaaa'

async function getParseAuthDependencies() {
  const config = shared.getCompleteConfig()
  const { privKeySet } = await getKeySets()
  const idToken =  await generateIdToken(config, privKeySet.id, 'id')
  const nonce = shared.generateNonce(config)
  const nonceHmac = shared.urlSafe.stringify(
    createHmac("sha256", config.nonceSigningSecret)
    .update(nonce)
    .digest("base64")
    .slice(0, config.nonceLength)
  )
  const { pkce, pkceHash } = shared.generatePkceVerifier(config)
  const requestedUri = `https://${intendedResourceHostname}/intended/path`
    const state = Buffer.from(JSON.stringify({
    requestedUri,
    nonce
  }), 'utf8').toString('base64')
  const code = TOKEN_AUTH_CODE
  return {
    nonce,
    nonceHmac,
    pkce,
    pkceHash,
    requestedUri,
    state,
    code,
    idToken
  }
}

async function validParseAuthRequest() {
  const dependencies = await getParseAuthDependencies()
  const { nonce, nonceHmac, pkce, pkceHash, requestedUri, state, code, idToken} = dependencies
  const cookies = {
    "spa-auth-edge-nonce": nonce,
    "spa-auth-edge-nonce-hmac": nonceHmac,
    "spa-auth-edge-pkce": pkce,
  }
  const event = {
    "Records": [
      {
        "cf": {
          "config": {
            "distributionId": "EXAMPLE"
          },
          "request": {
            "uri": "/parseauth",
            "querystring": stringifyQueryString({
              code, state
            }),
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
                  value: buildCookieString(cookies)
                }
              ]
            }
          }
        }
      }
    ]
  }
  return {event, dependencies}
}

function buildCookieString(cookieObject) {
  return Object.entries(cookieObject).map(([k, v]) => `${k}=${v}`).join("; ")
}

async function generateSignedToken(config, privKey, kid, claims, tokenIssuer, clientId, expiration, issuedAt) {
  return await new SignJWT(claims)
  .setProtectedHeader({ alg: 'RS256', kid })
  .setIssuedAt(issuedAt)
  .setIssuer(tokenIssuer || config.tokenIssuer)
  .setAudience(clientId || config.clientId)
  .setExpirationTime(expiration || '2h')
  .sign(privKey)
}

async function generateIdToken(config, privKey, kid, claims, tokenIssuer, clientId, expiration, issuedAt, groups) {
  groups = groups || [config.requiredGroup]
  if (!claims) {
    claims = {'id': true }
    if (groups !== 'nogroup') {
      claims["cognito:groups"] = groups
    }
  }
  return await generateSignedToken(config, privKey, kid || "id", claims, tokenIssuer, clientId, expiration, issuedAt)
}

async function generateAccessToken(config, privKey, kid, claims, tokenIssuer, clientId, expiration, issuedAt) {
  return await generateSignedToken(config, privKey, kid || 'access', {'access': true}, tokenIssuer, clientId, expiration, issuedAt)
}

async function generateRefreshToken(config, privKey, kid, claims, tokenIssuer, clientId, expiration, issuedAt) {
  return await generateSignedToken(config, privKey, kid || 'access', {'refresh': true}, tokenIssuer, clientId, expiration, issuedAt)
}

async function generateValidSecurityCookieValues(idPrivKey, accessPrivKey, tokenIssuer, clientId, expiration, issuedAt, kid, groups) {
  const config = shared.getCompleteConfig()
  return {
    "ID-TOKEN": await generateIdToken(config, idPrivKey, kid, null, tokenIssuer, clientId, expiration, issuedAt, groups),
    "ACCESS-TOKEN": await generateAccessToken(config, accessPrivKey, kid, null, tokenIssuer, clientId, expiration, issuedAt),
    "REFRESH-TOKEN": await generateRefreshToken(config, accessPrivKey, kid, null, tokenIssuer, clientId, expiration, issuedAt),
  }
}

async function generateCounterfeitSecurityCookieValues(idPrivKey, accessPrivKey, tokenIssuer, clientId, expiration, issuedAt, kid, groups) {
  const config = shared.getCompleteConfig()
  const key = await generateKeyPair('RS256')
  return {
    "ID-TOKEN": await generateIdToken(config, key.privateKey, kid, null, tokenIssuer, clientId, expiration, issuedAt, groups),
    "ACCESS-TOKEN": await generateAccessToken(config, key.privateKey, kid, null, tokenIssuer, clientId, expiration, issuedAt),
    "REFRESH-TOKEN": await generateRefreshToken(config, key.privateKey, kid, null, tokenIssuer, clientId, expiration, issuedAt),
  }
}

let defaultConfig = {
  "additionalCookies": {},
  "tokenJwksUri": "http://localhost:8000/.well-known/jwks.json",
  "tokenIssuer": "http://localhost:8000",
  "clientId": "hhhhhhhhhhhhhhhhhhhhhhhhhh",
  "clientSecret": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "cognitoAuthDomain": "http://localhost:8000",
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

shared.__set__('validateJwt', validateJwt)

let customConfig

shared.__set__("getConfigJson", function() { 
  const config = {...(customConfig || defaultConfig), ...{
    logger: raphlogger.init(null, {
      source: defaultConfig.source,
      level: defaultConfig.logLevel,
      sourceInstance: defaultConfig.sourceInstance,
      component: defaultConfig.component,
      asyncOutput: false
    })
  }}
  config.cloudFrontHeaders = shared.asCloudFrontHeaders(config.httpHeaders)
  return config
})

function clearCustomConfig() {
  customConfig = null
}

function useCustomConfig(config) {
  customConfig = config
}

function clearJwkCache() {
  validateJwt.__set__('jwksRsa', null)
}

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

async function getUnparseableAuthEvent() {
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
            "querystring": 'foo=bar',
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
                  value: buildCookieString({
                    "ID-TOKEN": "helloiamacookie",
                    "ACCESS-TOKEN": "andimheretosay",
                    "REFRESH-TOKEN": "cookiesarecoolkthxbye"
                  })
                }
              ]
            }
          }
        }
      }
    ]
  }
}

async function getAuthedEvent(tokenIssuer, clientId, expiration, issuedAt, kid, groups) {
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
                  value: buildCookieString(await generateValidSecurityCookieValues(privKeySet.id, privKeySet.access, tokenIssuer, clientId, expiration, issuedAt, kid, groups))
                }
              ]
            }
          }
        }
      }
    ]
  }
}

async function getAuthedEventWithNoRefresh(tokenIssuer, clientId, expiration, issuedAt, kid, groups) {
  const { privKeySet } = await getKeySets()
  const cookies = await generateValidSecurityCookieValues(privKeySet.id, privKeySet.access, tokenIssuer, clientId, expiration, issuedAt, kid, groups)
  delete cookies["REFRESH-TOKEN"]
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
                  value: buildCookieString(cookies)
                }
              ]
            }
          }
        }
      }
    ]
  }
}

async function getCounterfeitAuthedEvent(tokenIssuer, clientId, expiration, issuedAt, kid, groups) {
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
                  value: buildCookieString(await generateCounterfeitSecurityCookieValues(privKeySet.id, privKeySet.access, tokenIssuer, clientId, expiration, issuedAt, kid, groups))
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

function signoutCookieValue(c) {
  expect(c.path).toBe('/')
  expect(c.secure).toBe(true)
  expect(c.httpOnly).toBe(true)
  expect(c.sameSite).toBe('Strict')
  expect(c.maxAge).toBeUndefined()
  expect(c.expires.toUTCString()).toBe(new Date(0).toUTCString())
  expect(c.value).toBe("")
  return c.value
}

function validateCloudfrontHeaders(configHttpHeaders, response) {
  const cfHeaders = shared.asCloudFrontHeaders(configHttpHeaders)
  _.each(cfHeaders, (v, k) => {
    expect(_.isEqual(_.get(response.headers, k), v)).toBe(true)
  })
}

function validateRedirectToLogin(req, response) {
  const config = shared.getCompleteConfig()
  validateCloudfrontHeaders(config.httpHeaders, response)
  
  // Make sure the response is a redirect
  expect(response.status).toBe('307')

  // ensure there's one location header and it points at the auth domain
  expect(_.get(response, 'headers.location').length).toEqual(1)
  const locationHeader = new URL(response.headers.location[0].value)
  expect(locationHeader.origin).toEqual(config.cognitoAuthDomain)
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
  expect(parsedState.requestedUri).toBe(`${req.Records[0].cf.request.uri}${req.Records[0].cf.request.querystring ? `?${req.Records[0].cf.request.querystring}` : ""}`)

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

function validateRedirectToLogout(req, response) {
  const config = shared.getCompleteConfig()
  validateCloudfrontHeaders(config.httpHeaders, response)
  
  // Make sure the response is a redirect
  expect(response.status).toBe('307')

  // ensure there's one location header and it points at the auth domain
  expect(_.get(response, 'headers.location').length).toEqual(1)
  const locationHeader = new URL(response.headers.location[0].value)
  expect(`${locationHeader.origin}${locationHeader.pathname}`).toEqual(`https://${config.cognitoAuthDomain}/logout`)
  // Get the querystring arguments forwarded to the auth domain
  const queryParams = locationHeader.searchParams
  // make sure we're telling cognito to send the browser and authz code
  // back to the /parseauth endpoint, which completes the login
  expect(queryParams.get('logout_uri')).toEqual(`https://${intendedResourceHostname}${config.redirectPathSignOut}`)

  // ensure we're using the client ID from the config
  expect(queryParams.get('client_id')).toEqual(defaultConfig.clientId)

  // Now we validate the cookies and their relationship to the state
  // & challenge
  const setCookies = setCookieParser.parse(_.map(response.headers['set-cookie'], 'value'))

  // we should be setting three cookies; next we check the value of each
  expect(setCookies.length).toEqual(3)
  const cookies = _.reduce(setCookies, (acc, v) => {
    // as we get the value for each set-cookie header, verify that good security is set
    acc[v.name] = signoutCookieValue(v)
    return acc
  }, {})
}

function validateHtmlErrorPage(req, response, statusCode="200") {
  const config = shared.getCompleteConfig()
  validateCloudfrontHeaders(config.httpHeaders, response)
  
  // Make sure the response is a 200 with a string body
  expect(response.status).toBe(statusCode)
  expect(_.isString(response.body)).toBe(true)

  expect(response.headers['set-cookie']).toBeUndefined()
  expect(response.headers['content-type'][0].value).toBe("text/html; charset=UTF-8")
}

function validateRedirectToRefresh(req, response) {
  const config = shared.getCompleteConfig()
  validateCloudfrontHeaders(config.httpHeaders, response)
  
  // Make sure the response is a redirect
  expect(response.status).toBe('307')

  // ensure there's one location header and it points at the refresh endpoint on the current domain
  expect(_.get(response, 'headers.location').length).toEqual(1)
  const locationHeader = new URL(response.headers.location[0].value)
  expect(`${locationHeader.origin}${locationHeader.pathname}`).toEqual(`https://${intendedResourceHostname}${config.redirectPathAuthRefresh}`)
  // Get the querystring arguments forwarded to the refresh endpoint
  const queryParams = locationHeader.searchParams
  // make sure we're telling the refres endpoint where
  // to send the browser after refresh completes
  expect(queryParams.get('requestedUri')).toBe(req.Records[0].cf.request.uri)

  // Now we validate the cookies and their relationship to the nonce in the params
  const setCookies = setCookieParser.parse(_.map(response.headers['set-cookie'], 'value'))

  // we should be setting three cookies; next we check the value of each
  expect(setCookies.length).toEqual(2)
  const cookies = _.reduce(setCookies, (acc, v) => {
    // as we get the value for each set-cookie header, verify that good security is set
    acc[v.name] = secureCookieValue(v)
    return acc
  }, {})

  // Make sure the nonce in the state is the same as the one we 
  // are going to store in the browser
  const nonce = queryParams.get('nonce')
  expect(nonce).toBe(cookies["spa-auth-edge-nonce"])

  // And finally, check that the hmac we're setting in the browser is
  // correctly the digest of the nonce using the signing secret
  expect(
    shared.urlSafe.parse(shared.urlSafe.stringify(
      createHmac("sha256", defaultConfig.nonceSigningSecret)
      .update(nonce)
      .digest("base64")
      .slice(0, config.nonceLength)))
  ).toBe(
  shared.urlSafe.parse(cookies['spa-auth-edge-nonce-hmac'])
  )
}

function validateValidAuthPassthrough(req, response) {
  expect(_.isEqual(response, req.Records[0].cf.request)).toBe(true)
}

function getDefaultConfig() {
  return _.cloneDeep(defaultConfig)
}

module.exports = { setParseAuthDependencies, clearParseAuthDependencies, TOKEN_HANDLERS, setTokenHandler, clearTokenHandler, validParseAuthRequest, getParseAuthDependencies, validateHtmlErrorPage, validateRedirectToLogout, getDefaultConfig, useCustomConfig, clearCustomConfig, getAuthedEventWithNoRefresh, clearJwkCache, getCounterfeitAuthedEvent, getAuthedEvent, getUnauthEvent, getUnparseableAuthEvent, getKeySets, buildCookieString, generateSignedToken, generateIdToken, generateAccessToken, generateRefreshToken, generateValidSecurityCookieValues, generateCounterfeitSecurityCookieValues, defaultConfig, shared, startTestOauthServer, validateRedirectToLogin, validateValidAuthPassthrough, validateRedirectToRefresh }
