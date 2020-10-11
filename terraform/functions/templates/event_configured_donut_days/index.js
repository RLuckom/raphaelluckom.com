const {createTask} = require('donut-days');
const fs = require('fs')
const dependencyHelpers = fs.existsSync('./dependencyHelpers.js') ? require('./dependencyHelpers') : {}
const helpers = fs.existsSync('./helpers.js') ? require('./helpers') : {}
const _ = require('lodash'); 

exports.handler = (event, context, callback) => {
  createTask(_.cloneDeep(event.config), helpers, dependencyHelpers)(event, context, callback)
}
