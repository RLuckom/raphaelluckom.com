const {createTask} = require('donut-days');
const fs = require('fs')
const config = fs.existsSync('./config') ? require('./config') : {}
const _ = require('lodash'); 

exports.handler = createTask(config, {}, {})
