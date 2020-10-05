const {createTask} = require('donut-days');
const fs = require('fs')
const config = fs.existsSync('./config.js') ? require('./config') : {}
const _ = require('lodash'); 

exports.handler = createTask(config, config.helpers || {}, config.dependencyHelper || {})
