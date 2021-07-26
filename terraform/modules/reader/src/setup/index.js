const { generateKeyPair } = require('jose/util/generate_key_pair')
const { fromKeyLike } = require('jose/jwk/from_key_like')
const fs = require('fs')

async function gen() {
  const { publicKey, privateKey } = await generateKeyPair('EdDSA')
  const privateJwk = await fromKeyLike(privateKey)
  const publicJwk = await fromKeyLike(publicKey)
  fs.writeFileSync('public.json', JSON.stringify(publicJwk))
  fs.writeFileSync('private.json', JSON.stringify(privateJwk))
}

gen()
