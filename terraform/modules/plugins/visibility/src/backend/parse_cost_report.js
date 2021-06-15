const fs = require('fs')
const _ = require('lodash')
const {Gopher} = require('exploranda-core')
const {parseReportAccessSchema} = require('./parse_report_utils')
function main() {
  const dependencies = {
    testDep: {
      accessSchema: parseReportAccessSchema,
      params: {
        buf: { value: fs.readFileSync('overall-cost-report-00001.csv.gz')}
      }
    }
  }
  const gopher = Gopher(dependencies)
  gopher.report((e, r) => {
    if (e) {
      console.log(e)
      return
    }
    console.log(JSON.stringify(r.testDep[0], null, 2))
  })
}
main()
