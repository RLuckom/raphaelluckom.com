const rewire = require('rewire')
const checkAuth = rewire('../check_auth.js')
const { handler } = checkAuth
const http = require('http');

async function startTestServer() {
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
        if (req.method === "GET" && req.url === `/.well-known/microburin-social/keys/social-signing-public-key.jwk`) {
          res.setHeader('content-type', 'application/jwk+json')
          res.end(pubKeyJson, 'utf8');
        }
          currentTokenRequestValidator(req, body)
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
  async function closeServer(cb) {
    server.close(cb)
  }
  return { closeServer }
}

function getEvent(request) {
  return {
    Records: [
      {
        cf: request
      }
    ]
  }
}

function authedEvent(authHeaderString) {
  return getEvent({
    headers: {
      authorization: [
        {
          value: authHeaderString
        }
      ]
    }
  })
}

function tokenAuthedEvent(token) {
  return authedEvent(`Bearer ${token}`)
}

function validateAccessDenied(res, message) {
  expect(res.status).toEqual('401')
  expect(res.statusDescription).toEqual(message)
}

const messages = checkAuth.__get__('statusMessages')

describe("check auth", () => {
  let closeServer
  beforeEach(async () => {
    const serverControls = await startTestServer()
    closeServer = serverControls.closeServer
  })

  afterEach(() => closeServer())

  it("rejects a request if there is no auth", (done) => {
    handler(getEvent({})).then((res) => {
      console.log(res)
      validateAccessDenied(res, messages.noAuth)
      done()
    })
  })

  it("passes through a request with a valid token", (done) => {
    done()
  })

  it("rejects a request if the timestamp is in the future", (done) => {
    done()
  })

  it("rejects a request if there is no timestamp", (done) => {
    done()
  })

  it("rejects a request if the timestamp is too old", (done) => {
    done()
  })

  it("rejects a request if it is not signed for anyone", (done) => {
    done()
  })

  it("rejects a request if it is not signed for us", (done) => {
    done()
  })

  it("rejects a request if it was not signed", (done) => {
    done()
  })

  it("rejects a request if it was not signed by the right key", (done) => {
    done()
  })

  it("rejects a request if the sender isn't in our connections list", (done) => {
    done()
  })

  it("rejects a request if the key takes longer than 1s to get", (done) => {
    done()
  })

  it("rejects a request if the token can't be parsed", (done) => {
    done()
  })

})
