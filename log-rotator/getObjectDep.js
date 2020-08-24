

const unusedDeps = {
  object: {
    accessSchema: exploranda.dataSources.AWS.s3.getObject,
    params: {
      Bucket: {value: 'logs.raphaelluckom.com'},
      Key: {
        source: 'objects',
        formatter: ({objects}) => _.map(_.flatten(objects), 'Key')
      }
    },
    formatter: (res) => _.map(res, (r) => {
      const body = zlib.gunzipSync(r.Body).toString('utf8').split('\n').slice(2)
      const headers = ["date", "time", "x-edge-location", "sc-bytes", "c-ip", "cs-method", "cs(Host)", "cs-uri-stem", "sc-status", "cs(Referer)", "cs(User-Agent)", "cs-uri-query", "cs(Cookie)", "x-edge-result-type", "x-edge-request-id", "x-host-header", "cs-protocol", "cs-bytes", "time-taken", "x-forwarded-for", "ssl-protocol", "ssl-cipher", "x-edge-response-result-type", "cs-protocol-version", "fle-status", "fle-encrypted-fields", "c-port", "time-to-first-byte", "x-edge-detailed-result-type", "sc-content-type", "sc-content-len", "sc-range-start", "sc-range-end"]
      return _.map(body, (b) => _.zipObject(headers, b.split('\t')))
    })
  }
}
