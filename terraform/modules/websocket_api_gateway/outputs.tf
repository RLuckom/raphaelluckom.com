output "websocket_api" {
  value = {
    name = aws_apigatewayv2_api.websocket_api.name
    id = aws_apigatewayv2_api.websocket_api.id
    arn = aws_apigatewayv2_api.websocket_api.arn
    api_endpoint = aws_apigatewayv2_api.websocket_api.api_endpoint
    execution_arn = aws_apigatewayv2_api.websocket_api.execution_arn
  }
}

output "websocket_api_deployment" {
  value = {
    id = aws_apigatewayv2_deployment.websocket_api.id
    api_id = aws_apigatewayv2_deployment.websocket_api.api_id
  }
}

output "websocket_api_stage" {
  value = {
    id = aws_apigatewayv2_stage.stage.id
    name = aws_apigatewayv2_stage.stage.name
    api_id = aws_apigatewayv2_stage.stage.api_id
  }
}
