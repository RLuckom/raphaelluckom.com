const dd = require('donut-days')
function constructInvokePayload(payload) {
  if (payload.items.length === 0) {
    return []
  }
  return JSON.stringify(payload)
}

function processFirstItem(args) {
  console.log(JSON.stringify(args))
  return args.items[0]
}

function getRestItems(args) {
  console.log(JSON.stringify(args))
  return args.items.slice(1)
}
const donutDaysConfig = JSON.parse(process.env.DONUT_DAYS_CONFIG || "{}")
exports.handler = dd.createTask(donutDaysConfig, {constructInvokePayload, processFirstItem, getRestItems})
