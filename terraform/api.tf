module "websocket_connections_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "websocket_connections"
  ttl = [{
    enabled = true
    attribute_name = "stream_entry_time"
  }]
}

module "websocket_api_cert" {
  source = "./modules/validated_cert"
  route53_zone_name = var.route53_zone_name
  domain_name = var.api_domain_name
}

module "websocket_api_gateway_gateway" {
  source = "./modules/websocket_api_gateway"
  name_stem = "websocket_api"
  domain_record = [{
    domain_name = var.api_domain_name
    cert_arn = module.websocket_api_cert.cert.arn
    zone_name = var.route53_zone_name
  }
  ]
  lambda_routes = [
    {
    route_key = "$connect"
    handler_arn = module.event_log_lambda.lambda.arn
    handler_name = module.event_log_lambda.lambda.function_name
  },
    {
    route_key = "$disconnect"
    handler_arn = module.event_log_lambda.lambda.arn
    handler_name = module.event_log_lambda.lambda.function_name
  },
    {
    route_key = "$default"
    handler_arn = module.event_log_lambda.lambda.arn
    handler_name = module.event_log_lambda.lambda.function_name
  },
  ]
}

