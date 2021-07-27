const aws = require('aws-sdk')

const statusCodes = ${status_codes}
const dynamo = new aws.DynamoDB({region: '${dynamo_region}'})
const queryStructure = {
  ExpressionAttributeValues: {
    ":v1": {
      S: statusCodes.CONNECTED
    }
  }, 
  KeyConditionExpression: "connection_state = :v1", 
  TableName: "${dynamo_table_name}"
};

exports.handler = (event, context, callback) => {
  dynamo.query(queryStructure, (e, r) => {
    if (e) {
      console.log(e)
      callback(e)
      return
    } else {
      console.log(JSON.stringify(r))
      callback(null, r)
      return
    }
  })
}
