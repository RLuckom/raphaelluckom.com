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
  redeploy_sha = sha1(join(",", list(
module.websocket_api_conect_route.sha,
module.websocket_api_connect_rout.sha,
module.websocket_api_connect_route.sha
                          )))
}

module "websocket_api_connect_lambda_role" {
  source = "./modules/permissioned_role"
  role_name = "websocket_api_connect"
  role_policy = [{
    actions   =  [
      "dynamodb:PutItem",
    ]
    resources = [module.websocket_connections_table.table.arn]
  }]
  principals = [{
    type = "Service"
    identifiers = ["lambda.amazonaws.com"]
  }]
}

module "websocket_api_disconnect_role" {
  source = "./modules/permissioned_role"
  role_name = "websocket_api_disconnect"
  role_policy = [{
    actions   =  [
      "dynamodb:DeleteItem",
    ]
    resources = [module.websocket_connections_table.table.arn]
  }]
  principals = [{
    type = "Service"
    identifiers = ["lambda.amazonaws.com"]
  }]
}

module "websocket_api_connect_route" {
  source = "./modules/websocket_api_service_integration"
  route_key = "$default"
  lambda_name = "websocket-api-connect"
  api_id = module.websocket_api_gateway_gateway.websocket_api.id
  invoking_principal = {
    arn = module.websocket_api_gateway_gateway.websocket_api.arn
    service = "apigateway.amazonaws.com"
  }
  lambda_role_arn = module.websocket_api_connect_lambda_role.role.arn
  timeout_secs = 1
  mem_mb = 256
  lambda_code_bucket = aws_s3_bucket.lambda_bucket.id
  lambda_code_key = "event.logger/lambda.zip"
}

module "websocket_api_connect_rout" {
  source = "./modules/websocket_api_service_integration"
  route_key = "$connect"
  lambda_name = "websocet-api-connect"
  api_id = module.websocket_api_gateway_gateway.websocket_api.id
  invoking_principal = {
    arn = module.websocket_api_gateway_gateway.websocket_api.arn
    service = "apigateway.amazonaws.com"
  }
  lambda_role_arn = module.websocket_api_connect_lambda_role.role.arn
  timeout_secs = 1
  mem_mb = 256
  lambda_code_bucket = aws_s3_bucket.lambda_bucket.id
  lambda_code_key = "event.logger/lambda.zip"
}

module "websocket_api_conect_route" {
  source = "./modules/websocket_api_service_integration"
  route_key = "$disconnect"
  lambda_name = "websocket-pi-connect"
  api_id = module.websocket_api_gateway_gateway.websocket_api.id
  invoking_principal = {
    arn = module.websocket_api_gateway_gateway.websocket_api.arn
    service = "apigateway.amazonaws.com"
  }
  lambda_role_arn = module.websocket_api_connect_lambda_role.role.arn
  timeout_secs = 1
  mem_mb = 256
  lambda_code_bucket = aws_s3_bucket.lambda_bucket.id
  lambda_code_key = "event.logger/lambda.zip"
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
