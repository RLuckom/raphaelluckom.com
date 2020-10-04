data "aws_route53_zone" "selected" {
  count = length(var.domain_record) == 0 ? 0 : 1
  name = var.domain_record[0].zone_name
}

resource "aws_route53_record" "apigateway_domain" {
  count = length(var.domain_record) == 0 ? 0 : 1
  name = var.domain_record[0].domain_name
  type    = "A"
  zone_id = data.aws_route53_zone.selected[0].zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.api_domain_name[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api_domain_name[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_apigatewayv2_domain_name" "api_domain_name" {
  count = length(var.domain_record) == 0 ? 0 : 1
  domain_name = var.domain_record[0].domain_name

  domain_name_configuration {
    certificate_arn = var.domain_record[0].cert_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "websocket_api_mapping" {
  count = length(var.domain_record) == 0 ? 0 : 1
  api_id      = aws_apigatewayv2_api.websocket_api.id
  domain_name = aws_apigatewayv2_domain_name.api_domain_name[0].id
  stage       = aws_apigatewayv2_stage.stage.id 
}

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
    redeployment = local.configuration_sha
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
