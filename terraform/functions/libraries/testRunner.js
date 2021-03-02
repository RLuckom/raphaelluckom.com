const fs = require('fs')
const _ = require('lodash')
const yaml = require('js-yaml')
const { execSync } = require('child_process')
const { terraform_modules_repo } = require('./testSettings.json')
const path = require('path')

if (!process.argv[2]) {
  console.log("no module selected")
  process.exit(0)
}

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
  return _.map(layers, (l) => `${__dirname}/${terraform_modules_repo}/support_stacks/src/aws/layers/${l}/nodejs/node_modules/`).join(':')
}

const jasminePath = 'spec/support/node_modules/jasmine/bin/jasmine.js'
const nycPath = 'spec/support/node_modules/nyc/bin/nyc.js'
const parsed = parsePost(file)
const env = {
  NODE_PATH: `${makeNodePath(parsed.frontMatter.layers)}:${__dirname}/spec/support/node_modules/`,
  PATH: process.env.PATH,
}
try {
  const result = execSync(`${__dirname}/${nycPath} ${__dirname}/${jasminePath} ${fileDir}/${parsed.frontMatter.tests}`, {env})
  console.log(result.toString('utf8'))
} catch(e) {
  console.log(e)
  console.log(e.stdout.toString('utf8'))
}
