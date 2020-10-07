const {createTask} = require('donut-days');
const _ = require('lodash'); 

const helpers = {}
const dependencyHelpers = {}

exports.handler = (event, context, callback) => {
  createTask(_.cloneDeep(event.config), helpers, dependencyHelpers)(event, context, callback)
}
