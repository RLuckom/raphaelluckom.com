module "slack_api_gateway_gateway" {
  source = "github.com/RLuckom/terraform_modules//aws/apigatewayv2"
  name_stem = "slack_api"
  protocol = "HTTP"
  route_selection_expression = "$request.method $request.path"
  domain_record = [{
    domain_name = var.slack_api_domain_name
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
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/libraries/src/entrypoints/generic_donut_days.js") 
    }, 
    {
      file_name = "helpers.js"
      file_contents = file("./functions/libraries/src/helpers/donut_days.js") 
    }, 
    {
      file_name = "utils.js"
      file_contents = file("./functions/libraries/src/utils.js") 
    }, 
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/configs/slack_api/config.js",
      {
        slack_credentials_parameterstore_key = var.slack_credentials_parameterstore_key
        posts_table_name = module.posts_table.table.name
      }
    ) 
    }, 
  ]
  lambda_details = {
    action_name = "slack_api_handler"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      local.permission_sets.read_slack_credentials,
      module.posts_table.permission_sets.read,
      module.posts_table.permission_sets.write
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [aws_lambda_layer_version.donut_days.arn]
}
