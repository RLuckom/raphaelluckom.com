module "slack_api_gateway_gateway" {
  source = "./modules/apigatewayv2"
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
      file_name = "utils.js"
      file_contents = file("./functions/templates/test/utils.js") 
    }, 
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/templates/slack_api/config.js",
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

module "web_api_gateway_gateway" {
  source = "./modules/apigatewayv2"
  name_stem = "web_api"
  protocol = "HTTP"
  route_selection_expression = "$request.method $request.path"
  domain_record = [{
    domain_name = var.web_api_domain_name
    zone_name = var.route53_zone_name
  }
  ]
  lambda_routes = [
    {
      route_key = "$default"
      handler_arn = module.web_api_handler_lambda.lambda.arn
      handler_name = module.web_api_handler_lambda.lambda.function_name
    },
  ]
  cors_configuration = [{
    allow_origins = ["https://aphaelluckom.com", "https://www.raphaelluckom.com", "http://localhost"]
    allow_headers = null
    allow_methods = null
    allow_credentials = false
    expose_headers = null
    max_age = null
  }]
}

module "web_api_handler_lambda" {
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
      file_contents = templatefile("./functions/templates/web_api/config.js",
      {
        table_name = module.posts_table.table.name
      }
    ) 
    }, 
  ]
  lambda_details = {
    action_name = "web_api_handler"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      module.posts_table.permission_sets.read
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [aws_lambda_layer_version.donut_days.arn]
}

module "posts_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "posts"
  partition_key = {
    name = "id"
    type = "S"
  }
  range_key = {
    name = "timeAddedMs"
    type = "N"
  }
}
