function athenaPartitionQuery(athenaDb, athenaTable, objectKey) {
  const [ignore, date, uniqId] = objectKey.match(/.*([0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2})\.(.*).gz/)
  const { year, month, day, hour } = parseKeyDate(date)
  return `ALTER TABLE ${athenaDb}.${athenaTable}
          ADD IF NOT EXISTS 
          PARTITION (
            year = '${year}',
            month = '${month}',
            day = '${day}',
            hour = '${hour}' );`
}

const parseKeyDate(objectKey) {
  const [ignore, date, uniqId] = objectKey.match(/.*([0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2})\.(.*).gz/)
  const year = date.slice(0,4)
  const month = date.slice(5,7)
  const day = date.slice(8,10)
  const hour = date.slice(11,13)
  return {
    year, month, day, hour, uniqId, date
  }
}

module.exports = {
  athenaPartitionQuery,
  parseKeyDate
}
