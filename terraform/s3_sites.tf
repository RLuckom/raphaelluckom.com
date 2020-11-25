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
    id = "lists"
    path = "/meta/lists"
    site_path = "/meta/lists/*"
    apigateway_path = "/meta/lists/{list+}"
    gateway_name_stem = "lists"
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
      arn = module.stub.lambda.arn
      name = module.stub.lambda.function_name
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

resource "aws_s3_bucket_object" "object" {
  bucket = module.test_site.website_bucket.bucket.id
  key    = "site_description.json"
  content_type = "application/json"
  source = "./sites/test.raphaelluckom.com/site_description.json"
  etag = filemd5("./sites/test.raphaelluckom.com/site_description.json")
}


module "test_site_input" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
  bucket = "test-site-input"
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
      dependency_update_function = module.site_item_dependency_updater.lambda.arn
    }) 
    }
  ]
  lambda_details = {
    action_name = "site_render"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements =  concat(
      module.test_site_input.permission_sets.read_and_tag,
      module.test_site.website_bucket.permission_sets.put_object,
      module.site_item_dependency_updater.permission_sets.invoke
    )
  }
  layers = [
    aws_lambda_layer_version.donut_days.arn,
    aws_lambda_layer_version.markdown_tools.arn,
  ]

  bucket_notifications = [{
    bucket = module.test_site_input.bucket.id
    events              = ["s3:ObjectCreated:*" ]
    filter_prefix       = ""
    filter_suffix       = "post.md"
  }]
}

module "site_template_updater" {
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
      file_name = "config.js"
      file_contents = templatefile("./functions/templates/update_template/config.js",
    {
      website_bucket = module.test_site.website_bucket.bucket.id
      site_prefix = "https://test.raphaelluckom.com/"
      render_function = module.site_renderer.lambda.arn
      get_dependents_function = module.template_dependent_resolver.lambda.arn
    })
    }
  ]
  lambda_details = {
    action_name = "site_template_updater"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements =  concat(
      module.site_renderer.permission_sets.invoke,
      module.template_dependent_resolver.permission_sets.invoke
    )
  }
  layers = [
    aws_lambda_layer_version.donut_days.arn,
  ]

  bucket_notifications = [{
    bucket = module.test_site.website_bucket.bucket.id
    events              = ["s3:ObjectCreated:*" ]
    filter_prefix       = "assets/templates"
    filter_suffix       = "tmpl"
  }]
}

module "site_dependency_table" {
  source = "github.com/RLuckom/terraform_modules//aws/standard_dynamo_table"
  table_name = "site_dependency_table"
  partition_key = {
    name = "depended"
    type = "S"
  }
  range_key = {
    name = "dependent"
    type = "S"
  }
  global_indexes = [
    {
      name = "reverseDependencyIndex"
      hash_key = "dependent"
      range_key = "depended"
      write_capacity = 0
      read_capacity = 0
      projection_type = "ALL"
      non_key_attributes = []
    }
  ]
}

module "site_item_dependency_updater" {
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
      file_contents = templatefile("./functions/templates/update_dependencies_dynamo/config.js",
    {
      table = module.site_dependency_table.table.name,
      reverseDependencyIndex = "reverseDependencyIndex"
    })
    }
  ]
  lambda_details = {
    action_name = "site_item_dependency_updater"
    scope_name = "test"
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements = concat(
      module.site_dependency_table.permission_sets.read,
      module.site_dependency_table.permission_sets.write,
      module.site_dependency_table.permission_sets.delete_item,
    )
  }
  layers = [
    aws_lambda_layer_version.donut_days.arn,
  ]
}

module "template_dependent_resolver" {
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
      file_contents = templatefile("./functions/templates/get_dependencies_dynamo/config.js",
    {
      table = module.site_dependency_table.table.name,
    })
    }
  ]
  lambda_details = {
    action_name = "template_dependent_resolver"
    scope_name = "test"
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements = concat(
      module.site_dependency_table.permission_sets.read,
    )
  }
  layers = [
    aws_lambda_layer_version.donut_days.arn,
  ]
}

module "stub" {
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
      table = module.site_dependency_table.table.name
      forward_key_type = "depended"
      reverse_key_type = "dependent"
      reverse_association_index = "reverseDependencyIndex"
    })
    }
  ]
  lambda_details = {
    action_name = "stub"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements = concat(
      module.site_dependency_table.permission_sets.read,
    )
  }
  layers = [
    aws_lambda_layer_version.donut_days.arn,
  ]
}
