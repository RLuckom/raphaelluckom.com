const POLL_INTERVAL = 2000
window.GOPHER_CONFIG = {
  awsDependencies: {
    costReportSummary: {
      formatter: ([costReportSummary]) => {
        return JSON.parse(costReportSummary.Body.toString('utf8'))
      },
      accessSchema: exploranda.dataSources.AWS.s3.getObject,
      params: {
        Bucket: {value: CONFIG.cost_report_summary_storage_bucket },
        Key: { value: CONFIG.cost_report_summary_storage_key },
      }
    },
  },
  otherDependencies: {
  },
}
