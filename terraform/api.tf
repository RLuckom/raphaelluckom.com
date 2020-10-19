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
  domain_name = var.websocket_api_domain_name
}

module "websocket_api_gateway_gateway" {
  source = "./modules/apigatewayv2"
  name_stem = "websocket_api"
  protocol = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
  domain_record = [{
    domain_name = var.websocket_api_domain_name
    cert_arn = module.websocket_api_cert.cert.arn
    zone_name = var.route53_zone_name
  }
  ]
  lambda_routes = [
    {
    route_key = "$default"
    handler_arn = module.api_handler_test_lambda.lambda.arn
    handler_name = module.api_handler_test_lambda.lambda.function_name
  },
  ]
}


module "api_handler_test_lambda" {
  source = "./modules/permissioned_lambda"
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/templates/generic_donut_days/index.js") 
    }, 
    {
      file_contents = templatefile("./functions/templates/api_handler_test/config.js", {
        apigateway_management_endpoint = "${replace(module.websocket_api_gateway_gateway.api.api_endpoint, "wss://", "")}/prod"
      })
      file_name = "config.js"
    },
  ]
  lambda_details = {
    action_name = "api_handler_test"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      module.websocket_api_gateway_gateway.permission_sets.manage_connections
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [aws_lambda_layer_version.donut_days.arn]
}
