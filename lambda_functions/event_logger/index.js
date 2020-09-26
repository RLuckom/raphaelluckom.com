exports.handler = function(event, context, callback) {
  console.log(JSON.stringify(event))
  return { statusCode: 200, body: 'Connected.' };
}
