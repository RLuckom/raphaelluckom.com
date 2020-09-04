module "stream_items_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "stream_items"
}

module "websocket_connections_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "websocket_connections"
}

module "websocket_api_cert" {
  source = "./modules/validated_cert"
  route53_zone_name = var.route53_zone_name
  domain_name = var.api_domain_name
}

module "websocket_api_gateway_gateway" {
  source = "./modules/websocket_api_gateway"
  name_stem = "websocket_api"
}

data "aws_route53_zone" "selected" {
  name = var.route53_zone_name
}

resource "aws_route53_record" "apigateway_domain" {
  name    = var.api_domain_name
  type    = "A"
  zone_id = data.aws_route53_zone.selected.zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.api_domain_name.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api_domain_name.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_apigatewayv2_domain_name" "api_domain_name" {
  domain_name = var.api_domain_name

  domain_name_configuration {
    certificate_arn = module.websocket_api_cert.cert.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "websocket_api_mapping" {
  api_id      = module.websocket_api_gateway_gateway.websocket_api.id 
  domain_name = aws_apigatewayv2_domain_name.api_domain_name.id
  stage       = module.websocket_api_gateway_gateway.websocket_api_stage.id 
}
