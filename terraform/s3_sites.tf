module "static_site" {
  source = "github.com/RLuckom/terraform_modules//aws/cloudfront_s3_website"
  route53_zone_name = var.route53_zone_name
  domain_name = var.domain_name
  allowed_origins = ["https://${var.domain_name}", "http://localhost*"]
  domain_name_prefix = var.domain_name_prefix
  subject_alternative_names = var.subject_alternative_names
}

module "media_hosting_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/cloudfront_s3_website"
  route53_zone_name = var.route53_zone_name
  domain_name = var.media_domain_settings.domain_name
  allowed_origins = var.media_domain_settings.allowed_origins
  domain_name_prefix = var.media_domain_settings.domain_name_prefix
  subject_alternative_names = var.media_domain_settings.subject_alternative_names
}

module "test_site" {
  source = "github.com/RLuckom/terraform_modules//aws/cloudfront_s3_website"
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
      arn = module.two_way_resolver.lambda.arn
      name = module.two_way_resolver.lambda.function_name
    }
  }]
  route53_zone_name = var.route53_zone_name
  domain_name = var.test_domain_settings.domain_name
  allowed_origins = var.test_domain_settings.allowed_origins
  no_cache_s3_path_patterns = [ "/site_description.json" ]
  domain_name_prefix = var.test_domain_settings.domain_name_prefix
  subject_alternative_names = var.test_domain_settings.subject_alternative_names
  default_cloudfront_ttls = {
    min = 0
    default = 0
    max = 0
  }
}

resource "aws_s3_bucket_object" "site_description" {
  bucket = module.test_site.website_bucket.bucket.id
  key    = "site_description.json"
  content_type = "application/json"
  source = "./sites/test.raphaelluckom.com/site_description.json"
  etag = filemd5("./sites/test.raphaelluckom.com/site_description.json")
}

module "site_renderer" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  timeout_secs = 40
  mem_mb = 256
  environment_var_map = {
    DONUT_DAYS_DEBUG = true
  }
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
      file_contents = templatefile("./functions/templates/render_markdown_to_html/config.js",
    {
      website_bucket = module.test_site.website_bucket.bucket.id
      domain_name = "test.raphaelluckom.com"
      site_description_path = "site_description.json"
      dependency_update_function = module.trails_updater.lambda.arn
    }) 
    }
  ]
  lambda_details = {
    action_name = "site_render"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements =  concat(
      module.test_site.website_bucket.permission_sets.put_object,
      module.trails_updater.permission_sets.invoke
    )
  }
  layers = [
    aws_lambda_layer_version.donut_days.arn,
    aws_lambda_layer_version.markdown_tools.arn,
  ]

  bucket_notifications = [{
    bucket = module.test_site.website_bucket.bucket.id
    events              = ["s3:ObjectCreated:*" ]
    filter_prefix       = ""
    filter_suffix       = ".md"
  }]
}

module "trails_table" {
  source = "github.com/RLuckom/terraform_modules//aws/standard_dynamo_table"
  table_name = "trails_table"
  partition_key = {
    name = "trailName"
    type = "S"
  }
  range_key = {
    name = "memberName"
    type = "S"
  }
  global_indexes = [
    {
      name = "reverseDependencyIndex"
      hash_key = "memberName"
      range_key = "trailName"
      write_capacity = 0
      read_capacity = 0
      projection_type = "ALL"
      non_key_attributes = []
    }
  ]
}

module "trails_updater" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  timeout_secs = 40
  mem_mb = 128
  environment_var_map = {
    DONUT_DAYS_DEBUG = true
    EXPLORANDA_DEBUG = true
  }
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/templates/generic_donut_days/index.js") 
    },
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/templates/update_trails/config.js",
    {
      table = module.trails_table.table.name,
      reverse_association_index = "reverseDependencyIndex"
      domain_name = var.test_domain_settings.domain_name
      site_description_path = "site_description.json"
      self_type = "relations.meta.trail"
    })
    }
  ]
  lambda_details = {
    action_name = "trails_updater"
    scope_name = "test"
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements = concat(
      module.trails_table.permission_sets.read,
      module.trails_table.permission_sets.write,
      module.trails_table.permission_sets.delete_item,
    )
  }
  layers = [
    aws_lambda_layer_version.donut_days.arn,
  ]
}

module "two_way_resolver" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  timeout_secs = 40
  mem_mb = 128
  environment_var_map = {
    DONUT_DAYS_DEBUG = true
  }
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/templates/generic_donut_days/index.js") 
    },
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/templates/two_way_resolver/config.js",
    {
      table = module.trails_table.table.name
      forward_key_type = "trailName"
      reverse_key_type = "memberName"
      reverse_association_index = "reverseDependencyIndex"
    })
    }
  ]
  lambda_details = {
    action_name = "two_way_resolver"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements = concat(
      module.trails_table.permission_sets.read,
    )
  }
  layers = [
    aws_lambda_layer_version.donut_days.arn,
  ]
}
