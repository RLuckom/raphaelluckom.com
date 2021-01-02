data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

module "trails_table" {
  source = "github.com/RLuckom/terraform_modules//aws/standard_dynamo_table"
  table_name = "${var.site_name}-trails_table"
  partition_key = {
    name = "trailName"
    type = "S"
  }
  range_key = {
    name = "memberKey"
    type = "S"
  }
  global_indexes = [
    {
      name = "reverseDependencyIndex"
      hash_key = "memberKey"
      range_key = "trailName"
      write_capacity = 0
      read_capacity = 0
      projection_type = "ALL"
      non_key_attributes = []
    }
  ]
}

module "trails_resolver" {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  timeout_secs = 40
  mem_mb = 128
  debug = var.debug
  log_bucket = var.logging_bucket
  config_contents = templatefile("${path.root}/functions/configs/two_way_resolver/config.js",
  {
    table = module.trails_table.table.name
    forward_key_type = "trailName"
    reverse_key_type = "memberKey"
    reverse_association_index = "reverseDependencyIndex"
  })
  lambda_event_configs = var.lambda_event_configs
  action_name = "trails_resolver"
  scope_name = var.site_name
  policy_statements = concat(
    module.trails_table.permission_sets.read,
  )
  source_bucket = var.lambda_bucket
  donut_days_layer_arn = var.layer_arns.donut_days
}

module "website_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_website_bucket"
  bucket_name = var.domain_settings.domain_name
  origin_id = var.domain_settings.domain_name_prefix
  allowed_origins = var.domain_settings.allowed_origins

  lambda_notifications = [
    {
      lambda_arn = local.render_arn
      lambda_name = local.render_name
      events              = ["s3:ObjectCreated:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    },
    {
      lambda_arn = local.deletion_cleanup_arn
      lambda_name = local.deletion_cleanup_name
      events              = ["s3:ObjectRemoved:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    }
  ]
}

module "logging_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_logging_bucket"
  bucket_name = var.domain_settings.domain_name
}

resource "aws_s3_bucket_object" "site_description" {
  bucket = module.website_bucket.bucket.bucket.id
  key    = "site_description.json"
  content_type = "application/json"
  content = var.site_description_content
  etag = md5(var.site_description_content)
}

module "site" {
  source = "github.com/RLuckom/terraform_modules//aws/cloudfront_s3_website"
  website_buckets = [module.website_bucket.cloudfront_origin]
  logging_config = module.logging_bucket.cloudfront_logging
  lambda_origins = [{
    id = "trails"
    path = "/meta/relations/trails"
    site_path = "/meta/relations/trails*"
    apigateway_path = "/meta/relations/trails/{trail+}"
    gateway_name_stem = "trails"
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods = ["GET", "HEAD"]
    compress = true
    ttls = {
      min = 0
      default = 0
      max = 0
    }
    forwarded_values = {
      query_string = true
      query_string_cache_keys = []
      headers = []
    }
    lambda = {
      arn = module.trails_resolver.lambda.arn
      name = module.trails_resolver.lambda.function_name
    }
  }]
  route53_zone_name = var.route53_zone_name
  domain_name = var.domain_settings.domain_name
  no_cache_s3_path_patterns = [ "/site_description.json" ]
  domain_name_prefix = var.domain_settings.domain_name_prefix
  subject_alternative_names = var.domain_settings.subject_alternative_names
  default_cloudfront_ttls = var.default_cloudfront_ttls
}
