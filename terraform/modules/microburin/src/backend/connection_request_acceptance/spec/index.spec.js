const _ = require('lodash')
const rewire = require('rewire')
const checkAuth = rewire('../index.js')
const http = require('http');
const { parseJwk } = require('jose-node-cjs-runtime/jwk/parse')
const { FlattenedSign } = require('jose-node-cjs-runtime/jws/flattened/sign')
const { generateKeyPair } = require('jose-node-cjs-runtime/util/generate_key_pair')
const converter = new require('aws-sdk').DynamoDB.Converter

const publicKeyObject = {
  "kty":"OKP",
  "crv":"Ed25519",
  "x":"wxeatbwWtfGpu8QOUIdP6-3NG5JkurcRHhEfQIFxgck"
}

const privateKeyObject = {
  "kty":"OKP",
  "crv":"Ed25519",
  "x":"wxeatbwWtfGpu8QOUIdP6-3NG5JkurcRHhEfQIFxgck",
  "d":"HmN_oSGvMGjcvbbniIcgc1PfQZBZVBC29MmDb7o9FRc"
}

const fakeDynamo = {
  query: function (config, callback) {
    if (queryError) {
      return setTimeout(() => callback(queryError), queryTime)
    } else {
      return setTimeout(() => callback(null, {Items: _.map(connections, (c) => {
        return converter.marshall({
          domain: c,
          "${connection_state_key}" : REQUEST_TYPE,
        })
      })}), queryTime)
    }
  },
  putItem: function(config, callback) {
    savedRequests.push(converter.unmarshall(config.Item))
    callback()
  }
}

let responseMessage, responseOrigin, responseResult
let savedRequests = []

function fakeSuccessResponseBuilder(original) {
  return (internalMessage, origin, result) => {
    responseOrigin = origin
    responseMessage = internalMessage
    responseResult = result
    return original(internalMessage, origin, result)
  }
}

const pubKeyJson = JSON.stringify(publicKeyObject)
let queryError
let connections = []
let queryTime = 0

async function startTestServer() {
  let pubKeyServer
  await new Promise(function(resolve, reject) {
    pubKeyServer = http.createServer((req, res) => {
      const chunks = []
      let body
      req.on('data', (chunk) => {
        chunks.push(chunk)
      })
      req.on('end', () => {
        body = Buffer.concat(chunks).toString()
        if (req.method === "GET" && req.url === `/.well-known/microburin-social/keys/social-signing-public-key.jwk`) {
          res.setHeader('content-type', 'application/jwk+json')
          setTimeout(() => {
            res.end(pubKeyJson, 'utf8')
          }, queryTime)
        }
      })
    });
    pubKeyServer.on('clientError', (err, socket) => {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    pubKeyServer.listen(8001, (e, r) => {
      if (e) {
        console.log(e)
        reject(e)
      }
      resolve(r)
    });
  })
  function closeServer(cb) {
    let servers = 1
    function end() {
      servers -= 1
      if (!servers) {
        return cb()
      }
    }
    pubKeyServer.close(end)
  }
  return { closeServer }
}

function getEvent(request) {
  return {
    Records: [
      {
        cf: { request }
      }
    ]
  }
}

function authedEvent(authHeaderString) {
  return {
    headers: {
      'microburin-signature': authHeaderString
    }
  }
}

function tokenAuthedEvent(token) {
  return authedEvent(`${formatToken(token)}`)
}

function replaceKeyLocation(domain) {
  return "http://" + domain + `/.well-known/microburin-social/keys/social-signing-public-key.jwk`
}

let domain = "${domain}"
let connectionSalt = "${connection_list_salt}"
let connectionPassword = "${connection_list_password}"
const safeOrigin = "localhost:8001"

async function validSignedTokenAuthEvent({timestamp, origin, requestType, recipient}, signingKey) {
  const sig = await new FlattenedSign(new TextEncoder().encode(JSON.stringify({timestamp, origin, requestType, recipient}))).setProtectedHeader({alg: 'EdDSA'}).sign(signingKey)
  const ret = {timestamp, origin, recipient, requestType, sig}
  return tokenAuthedEvent(ret)
}

async function validUnsignedTokenAuthEvent({timestamp, origin, requestType, recipient}, signingKey) {
  const sig = await new FlattenedSign(new TextEncoder().encode(JSON.stringify({timestamp, origin, requestType, recipient}))).setProtectedHeader({alg: 'EdDSA'}).sign(signingKey)
  const ret = {timestamp, origin, requestType, recipient}
  return tokenAuthedEvent(ret)
}

function validateSuccess(res, expectedResponseMessage, expectedResponseOrigin, expectedResponseResult, expectedSavedItems) {
  expectedSavedItems = expectedSavedItems || []
  _.map(_.zip(expectedSavedItems, savedRequests), ([expected, saved]) => {
    expect(saved["${connection_type_key}"]).toEqual('${connection_type_initial}')
    expect(saved["${domain_key}"]).toEqual(expected.domain)
    expect(saved["${connection_table_state_key}"]).toEqual("${connection_status_code_connected}")
  })
  expect(res.statusCode).toEqual(200)
  expect(res.statusDescription).toEqual('OK')
  expect(responseMessage).toEqual(expectedResponseMessage)
  expect(responseOrigin).toEqual(expectedResponseOrigin)
  expect(responseResult).toEqual(expectedResponseResult)
}

function validateRequestPassThrough(res, evt) {
  expect(res).toEqual(evt.Records[0].cf.request)
}

function formatToken({sig, timestamp, origin, requestType, recipient}) {
  return Buffer.from(JSON.stringify({sig, timestamp, origin, requestType, recipient})).toString('base64')
}

const STATUS_MESSAGES = checkAuth.__get__('STATUS_MESSAGES')
const RESULTS = checkAuth.__get__('RESULTS')
const REQUEST_TYPE = checkAuth.__get__('REQUEST_TYPE')

describe("check auth", () => {
  let closeServer, privateKey, otherKey, unsetArray
  beforeEach(async () => {
    const serverControls = await startTestServer()
    closeServer = serverControls.closeServer
    privateKey = await parseJwk(privateKeyObject, 'EdDSA')
    const otherKeys = await generateKeyPair('EdDSA')
    otherKey = otherKeys.privateKey
    savedRequests = []
    unsetArray = [checkAuth.__set__('connectionEndpoint', 'http://localhost:8000')]
    unsetArray.push(checkAuth.__set__('CONNECTIONS', {
      timeout: 0,
      connections: []
    })) 
    unsetArray.push(checkAuth.__set__('keyLocation', replaceKeyLocation)) 
    unsetArray.push(checkAuth.__set__('dynamo', fakeDynamo)) 
    unsetArray.push(checkAuth.__set__('successResponse', fakeSuccessResponseBuilder(checkAuth.__get__('successResponse')))) 
  })

  afterEach((done) => {
    connections = []
    queryTime = 0
    _.each(unsetArray, (f) => f())
    closeServer(done)
  })

  it("rejects a request if there is no auth", (done) => {
    checkAuth.handler(getEvent({})).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.noAuth, null, RESULTS.NOOP)
      done()
    })
  })

  it("rejects a request if the token can't be parsed", async () => {
    const now = new Date().getTime()
    const evt = await validSignedTokenAuthEvent({recipient: domain, timestamp: now}, privateKey)
    evt.headers['microburin-signature'] += "aea"
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.unparseableAuth, null, RESULTS.NOOP)
    })
  })

  it("rejects a request if it is not signed for anyone", async () => {
    const now = new Date().getTime()
    const evt = await validUnsignedTokenAuthEvent({timestamp: now}, privateKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.noSig, null, RESULTS.NOOP)
    })
  })

  it("rejects a request if the origin isn't a string", async () => {
    const now = new Date().getTime()
    const evt = await validSignedTokenAuthEvent({recipient: domain, timestamp: now}, privateKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.noOrigin, null, RESULTS.NOOP)
    })
  })

  it("rejects a request if the request type is wrong", async () => {
    const future = new Date().getTime() + 10000
    const evt = await validSignedTokenAuthEvent({origin: safeOrigin, requestType: 'boop', timestamp: future}, privateKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.wrongRequestType, safeOrigin, RESULTS.NOOP)
    })
  })

  it("rejects a request if the timestamp is in the future", async () => {
    const future = new Date().getTime() + 10000
    const evt = await validSignedTokenAuthEvent({origin: safeOrigin, requestType: REQUEST_TYPE, timestamp: future}, privateKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.futureTimestamp, safeOrigin, RESULTS.NOOP)
    })
  })

  it("rejects a request if there is no timestamp", async () => {
    const evt = await validSignedTokenAuthEvent({origin: safeOrigin, requestType: REQUEST_TYPE}, privateKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.badTimestamp, safeOrigin, RESULTS.NOOP)
    })
  })

  it("rejects a request if the timestamp is too old", async () => {
    const past = new Date().getTime() - 100000
    const evt = await validSignedTokenAuthEvent({timestamp: past, origin: safeOrigin, requestType: REQUEST_TYPE}, privateKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.expiredTimestamp, safeOrigin, RESULTS.NOOP)
    })
  })

  it("rejects a request if it is not signed for us", async () => {
    const now = new Date().getTime()
    const evt = await validSignedTokenAuthEvent({recipient: "anyone", timestamp: now, origin: safeOrigin, requestType: REQUEST_TYPE}, privateKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.wrongRecipient, safeOrigin, RESULTS.NOOP)
    })
  })

  it("rejects a request if the connection already exists", async () => {
    const now = new Date().getTime()
    const evt = await validSignedTokenAuthEvent({origin: safeOrigin, recipient: domain, timestamp: now, requestType: REQUEST_TYPE}, otherKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.unrecognizedOrigin, safeOrigin, RESULTS.NOOP)
    })
  })

  it("rejects a request if the connection already exists", async () => {
    const now = new Date().getTime()
    connections.push(safeOrigin)
    const evt = await validSignedTokenAuthEvent({origin: safeOrigin, recipient: domain, timestamp: now, requestType: REQUEST_TYPE}, otherKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.verifyFailed, safeOrigin, RESULTS.NOOP)
    })
  })

  it("rejects a request if the key takes longer than 1s to get", async () => {
    const now = new Date().getTime()
    connections.push(safeOrigin)
    queryTime = 2000
    const evt = await validSignedTokenAuthEvent({origin: safeOrigin, recipient: domain, timestamp: now, requestType: REQUEST_TYPE}, privateKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.noSigningKey, safeOrigin, RESULTS.NOOP)
    })
  })

  it("passes through a request with a valid token", async () => {
    const now = new Date().getTime()
    connections.push(safeOrigin)
    const evt = await validSignedTokenAuthEvent({requestType: REQUEST_TYPE, origin: safeOrigin, recipient: domain, timestamp: now}, privateKey)
    return checkAuth.handler(evt).then((res) => {
      validateSuccess(res, STATUS_MESSAGES.success, safeOrigin, RESULTS.CREATE_RECORD, [{domain: 'localhost:8001'}])
    })
  })

})
