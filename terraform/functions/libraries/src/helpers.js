const fs = require('fs')

const helperFiles = fs.readdirSync(`${__dirname}/helpers`)

helperFiles.forEach((f) => {
  const name = f.split('.')[0]
  module.exports[name] = require(`${__dirname}/helpers/${name}`)
})
