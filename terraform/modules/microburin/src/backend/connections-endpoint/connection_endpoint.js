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
  if (event.headers.authorization === "Bearer ${connection_list_password}") {
    dynamo.query(queryStructure, (e, r) => {
      if (e) {
        console.log(e)
        callback(e)
        return
      } else {
        console.log(JSON.stringify({
          connections: r.Items,
          timestamp: new Date().getTime(),
        }))
        callback(
          null,
          {
            "isBase64Encoded": false,
            "statusCode": 200,
            "headers": { "content-type": "application/json" },
            "multiValueHeaders": {},
            "body":  JSON.stringify({
              connections: r.Items,
              timestamp: new Date().getTime(),
            }),
          }
        )
        return
      }
    })
  } else {
    callback(
      null, 
      {
        "isBase64Encoded": false,
        "statusCode": 401,
        "headers": { "content-type": "text/plain" },
        "multiValueHeaders": {},
        body: "",
      }
    )
  }
}
