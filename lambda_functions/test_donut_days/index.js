const dd = require('donut-days')
function constructInvokePayload(payload) {
  return JSON.stringify(payload)
}
const donutDaysConfig = JSON.parse(process.env.DONUT_DAYS_CONFIG || "{}")
exports.handler = dd.createTask(donutDaysConfig, () => { return {} }, {constructInvokePayload})
