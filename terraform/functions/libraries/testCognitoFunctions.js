
const fs = require('fs')
const _ = require('lodash')
const { execSync } = require('child_process')
const { terraform_modules_repo } = require('./testSettings.json')
const path = require('path')

const jasminePath = 'spec/support/node_modules/jasmine/bin/jasmine.js'
const nycPath = 'spec/support/node_modules/nyc/bin/nyc.js'
const tests = '../../spec/src/cognito_functions/*.spec.js'
const layers = ['cognito_utils']

function makeNodePath(layers) {
  return _.map(layers, (l) => `${__dirname}/${terraform_modules_repo}/support_stacks/src/aws/layers/${l}/nodejs/node_modules/`).join(':')
}

const env = {
  NODE_PATH: `${makeNodePath(layers)}:${__dirname}/spec/support/node_modules/`,
  PATH: process.env.PATH,
}
try {
  const result = execSync(`${__dirname}/${nycPath} ${__dirname}/${jasminePath} ${__dirname}/src/cognito_functions/${tests}`, {env})
  console.log(result.toString('utf8'))
} catch(e) {
  console.log(e)
  console.log(e.stdout.toString('utf8'))
}
