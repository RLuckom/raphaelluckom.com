resource "aws_apigatewayv2_api" "websocket_api" {
  name                       = "${var.name_stem}_websocket_api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = var.route_selection_expression
}

resource "aws_apigatewayv2_deployment" "websocket_api" {
  api_id      = aws_apigatewayv2_api.websocket_api.id

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = var.redeploy_sha// replace with sha of concat of routes && integrations
  }
}

resource "aws_apigatewayv2_stage" "stage" {
  api_id = aws_apigatewayv2_api.websocket_api.id
  name   = var.apigateway_stage_name
  deployment_id = aws_apigatewayv2_deployment.websocket_api.id
}
