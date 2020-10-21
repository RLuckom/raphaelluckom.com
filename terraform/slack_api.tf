module "slack_api_cert" {
  source = "./modules/validated_cert"
  route53_zone_name = var.route53_zone_name
  domain_name = var.slack_api_domain_name
}

module "slack_api_gateway_gateway" {
  source = "./modules/apigatewayv2"
  name_stem = "slack_api"
  protocol = "HTTP"
  route_selection_expression = "$request.method $request.path"
  domain_record = [{
    domain_name = var.slack_api_domain_name
    cert_arn = module.slack_api_cert.cert.arn
    zone_name = var.route53_zone_name
  }
  ]
  lambda_routes = [
    {
    route_key = "$default"
    handler_arn = module.slack_api_handler_lambda.lambda.arn
    handler_name = module.slack_api_handler_lambda.lambda.function_name
  },
  ]
}


module "slack_api_handler_lambda" {
  source = "./modules/permissioned_lambda"
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/templates/generic_donut_days/index.js") 
    }, 
    {
      file_name = "helpers.js"
      file_contents = file("./functions/templates/generic_donut_days/helpers.js") 
    }, 
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/templates/slack_api/config.js",
      {
        slack_credentials_parameterstore_key = var.slack_credentials_parameterstore_key
      }
    ) 
    }, 
  ]
  lambda_details = {
    action_name = "slack_api_handler"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      module.slack_api_gateway_gateway.permission_sets.manage_connections,
      local.permission_sets.read_slack_credentials
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [aws_lambda_layer_version.donut_days.arn]
}
