const {createTask} = require('donut-days');
const fs = require('fs')
const config = fs.existsSync('./config.js') ? require('./config') : {}
const recordCollectors = fs.existsSync('./recordCollectors.js') ? require('./recordCollectors') : {}
const _ = require('lodash'); 

function loadHelpers(s) {
  const sourcePath = `${__dirname}/${s}`
  let helpers = {}
  if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isDirectory()) {
    const helperFiles = fs.readdirSync(sourcePath)
    helperFiles.forEach((f) => {
      const name = f.split('.')[0]
      helpers[name] = require(`${sourcePath}/${name}`)
    })
    return helpers
  } else if (fs.existsSync(`${sourcePath}.js`) && fs.statSync(`${sourcePath}.js`).isFile()) {
    return require(`${sourcePath}.js`)
  }
  return helpers
}

const helpers = loadHelpers('helpers')
const dependencyHelpers = loadHelpers('dependencyHelpers')

exports.handler = (event, context, callback) => {
  const ddConfig = event.config || config || {}
  config.expectations = config.expectations || event.expectations || {}
  const ddEvent = event.event || event || {}
  createTask(_.cloneDeep(ddConfig), helpers, dependencyHelpers, recordCollectors)(ddEvent, context, callback)
}
