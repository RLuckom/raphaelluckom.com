module "media_input_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_bucket"
  bucket = "rluckom-media-input"
  lifecycle_rules = [{
    id = "expire-processed"
    prefix = ""
    tags = {
      processed = "true"
    }
    enabled = true
    expiration_days = 3
  }]

  lambda_notifications = local.media_input_trigger_jpeg
}

module "media_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "media"
}

module "labeled_media_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "labeled_media"
  partition_key = {
    name = "label"
    type = "S"
  }
  range_key = {
    name = "mediaId"
    type = "S"
  }
}

module "stream_input_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_bucket"
  bucket = var.stream_input_bucket_name
  lifecycle_rules = [{
    id = "expire-processed"
    prefix = ""
    tags = {
      processed = "true"
      posted = "true"
    }
    enabled = true
    expiration_days = 3
  }]
  lambda_notifications = local.media_input_trigger_jpeg
}

module "web_api_gateway_gateway" {
  source = "github.com/RLuckom/terraform_modules//aws/apigatewayv2"
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
}

module "web_api_handler_lambda" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/libraries/src/entrypoints/generic_donut_days.js") 
    }, 
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/configs/web_api/config.js",
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
  layers = [module.donut_days.layer.arn]
}

module "posts_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
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
