const { Readable } = require('stream');

const csv = require('csv-parser')
const _ = require('lodash')

function toSecs(s) {
  return _.parseInt(s.slice(0, 2)) * 3600 + _.parseInt(s.slice(3, 5)) * 60 + _.parseInt(s.slice(6, 8))
}

function parseResults({buf}, callback) {
  const metrics = {
    ips: {}
  }
  const ips = metrics.ips
  const requestRecords = []

  Readable.from(buf)
  .pipe(csv())
  .on('data', (data) => {
    if (!ips[data.requestIp]) {
      ips[data.requestIp] = {
        hits: 0,
        atsl: 0,
        tsls: []
      }
    }
    const oldLast = ips[data.requestIp].last
    ips[data.requestIp].last = toSecs(data.time)
    const tsl = oldLast - ips[data.requestIp].last
    ips[data.requestIp].tsls.push(tsl)
    ips[data.requestIp].atsl = ips[data.requestIp].hits ? (ips[data.requestIp].atsl * ips[data.requestIp].hits + tsl) / ips[data.requestIp].hits + 1 : null
    ips[data.requestIp].hits++
    requestRecords.push(data)
  }).on('end', () => {
    _.each(metrics.ips, (p) => {
      if (p.atsl) {
        p.full = 300 * p.hits 
        p.score = p.hits * p.atsl / p.full
        p.dist = _.countBy(p.tsls, (tsl) => {
          if (tsl < 2) {
            return -1
          } else if (tsl < 3) {
            return 0
          } else if (tsl < 5) {
            return 1
          } else if (tsl < 20) {
            return 2
          } else if (tsl < 60) {
            return 3
          } else if (tsl < 600) {
            return 4
          }
          return 5
        })
        if ((p.dist["-1"] > 2) || (p.dist['-1'] + p.dist['0'] + p.dist['1']) > 4 || p.score < 0.25) {
          p.flag = true
        }
      }
    })
    const hits = _.reduce(requestRecords, (acc, v) => {
      if (!ips[v.requestIp].flag && v.status === '200') {
        acc[v.uri] = (acc[v.uri] || 0) + 1
      }
      return acc
    }, {})
    callback(null, {hits, metrics})
  })
}

module.exports = {
  parseResults
}
