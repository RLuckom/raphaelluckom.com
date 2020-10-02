const handler = require('./index').handler

handler({}, {}, (e, r) => {
  if (e) {
    console.log(e)
  }
  console.log(JSON.stringify(r))
})
