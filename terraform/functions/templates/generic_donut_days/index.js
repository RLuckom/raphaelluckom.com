const {createTask} = require('donut-days');
const fs = require('fs')
const config = fs.existsSync('./config.js') ? require('./config') : {}
const dependencyHelpers = fs.existsSync('./dependencyHelpers.js') ? require('./dependencyHelpers') : {}
const helpers = fs.existsSync('./helpers.js') ? require('./helpers') : {}
const recordCollectors = fs.existsSync('./recordCollectors.js') ? require('./recordCollectors') : {}
const _ = require('lodash'); 

exports.handler = createTask(config, helpers, dependencyHelpers, recordCollectors)
