const fs = require('fs')
const _ = require('lodash')
const yaml = require('js-yaml')
const { execSync } = require('child_process')
const path = require('path')

const fileName = `${__dirname}/${process.argv[2]}`
const fileDir = path.dirname(fileName)

const file = fs.readFileSync(fileName, 'utf8')

function parsePost(s) {
  const t = s.split('\n')
  if (_.trim(t[0]) === '/*') {
    let started = false
    let frontMatter = ''
    let content = ''
    for (r of t.slice(1)) {
      if (_.trim(r) === '*/') {
        if (!started) {
          started = true
        }
      } else {
        if (started) {
          content += r + "\n"
        } else {
          frontMatter += r + '\n'
        }
      }
    }
    try {
      const fm = yaml.safeLoad(frontMatter)
      if (fm.date) {
        fm.date = moment(fm.date)
      }
      return { frontMatter: fm, content, raw:s }
    } catch(e) {
      return { raw: s} 
    }
  } else {
    return { raw: s }
  }
}

function makeNodePath(layers) {
  return _.map(layers, (l) => `${__dirname}/../../layers/${l}/nodejs/node_modules/`).join(':')
}

const jasminePath = 'spec/support/node_modules/jasmine/bin/jasmine.js'
const parsed = parsePost(file)
const env = {
  NODE_PATH: makeNodePath(parsed.frontMatter.layers),
  PATH: process.env.PATH,
}
try {
  execSync(`${__dirname}/${jasminePath} ${fileDir}/${parsed.frontMatter.tests}`, {env}).stdout.toString('utf8')
} catch(e) {
  console.log(e.stdout.toString('utf8'))
}
