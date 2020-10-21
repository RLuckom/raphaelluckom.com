const {createTask} = require('donut-days');
const fs = require('fs')
const config = fs.existsSync('./config.js') ? require('./config') : {}
const dependencyHelpers = fs.existsSync('./dependencyHelpers.js') ? require('./dependencyHelpers') : {}
const helpers = fs.existsSync('./helpers.js') ? require('./helpers') : {}
const _ = require('lodash'); 

exports.handler = (event, context, callback) => {
  const ddConfig = event.config || config || {}
  config.expectations = config.expectations || event.expectations || {}
  const ddEvent = event.event || event || {}
  createTask(_.cloneDeep(ddConfig), helpers, dependencyHelpers, recordCollectors)(ddEvent, context, callback)
}
