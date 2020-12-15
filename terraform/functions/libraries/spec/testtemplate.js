const _ = require('lodash')
const fs = require('fs')

const template = _.template(fs.readFileSync(process.argv[2]))

console.log(template.source)
try { 
console.log(template({}))
} catch(e) {}
