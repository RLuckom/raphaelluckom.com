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

resource "aws_cloudwatch_log_group" "apigateway_log_group" {
	name              = "/aws/apigateway/${aws_apigatewayv2_api.websocket_api.id}/${var.apigateway_stage_name}"
	retention_in_days = var.log_retention_period
}

resource "aws_apigatewayv2_stage" "stage" {
  api_id = aws_apigatewayv2_api.websocket_api.id
  name   = var.apigateway_stage_name
  deployment_id = aws_apigatewayv2_deployment.websocket_api.id
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigateway_log_group.arn
    format = "[ '$context.requestId' ] [ $context.requestTimeEpoch ] [ $context.identity.sourceIp ] [ $context.connectionId ] [ $context.eventType ] [ $context.status ] [ $context.routeKey ] [ $context.stage ] [ $context.integration.requestId ] [ $context.integration.latency ] [ $context.integration.status ] [ '$context.integration.error' ] [ $context.apiId ] [ $context.connectedAt ] [ $context.domainName ] [ $context.error.messageString ]"
  }
}
