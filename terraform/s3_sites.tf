module "static_site" {
  source = "github.com/RLuckom/terraform_modules//aws/static_site"
  route53_zone_name = var.route53_zone_name
  domain_name = var.domain_name
  allowed_origins = ["https://${var.domain_name}", "http://localhost*"]
  domain_name_prefix = var.domain_name_prefix
  subject_alternative_names = var.subject_alternative_names
}

module "media_hosting_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/static_site"
  route53_zone_name = var.route53_zone_name
  domain_name = var.media_domain_settings.domain_name
  allowed_origins = var.media_domain_settings.allowed_origins
  domain_name_prefix = var.media_domain_settings.domain_name_prefix
  subject_alternative_names = var.media_domain_settings.subject_alternative_names
}

module "test_site" {
  source = "github.com/RLuckom/terraform_modules//aws/static_site"
  route53_zone_name = var.route53_zone_name
  domain_name = var.test_domain_settings.domain_name
  allowed_origins = var.test_domain_settings.allowed_origins
  domain_name_prefix = var.test_domain_settings.domain_name_prefix
  subject_alternative_names = var.test_domain_settings.subject_alternative_names
  default_cloudfront_ttls = {
    min = 0
    default = 0
    max = 0
  }
}

module "test_site_input" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
  bucket = "test-site-input"
}

module "test_site_templates" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
  bucket = "test-site-templates"
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
      file_contents = templatefile("./functions/templates/site-sync/config.js",
    {
      website_bucket = module.test_site.website_bucket.bucket.id
    }) 
    }
  ]
  lambda_details = {
    action_name = "site_render"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements =  concat(
      module.test_site_input.permission_sets.read_and_tag,
      module.test_site_templates.permission_sets.read_and_tag,
      module.test_site.website_bucket.permission_sets.put_object,
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
    filter_suffix       = ""
  }]
}
