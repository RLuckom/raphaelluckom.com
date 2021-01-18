module "media_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_website_bucket"
  domain_parts = {
    top_level_domain = "com"
    controlled_domain_part = "media.raphaelluckom"
  }
  additional_allowed_origins = var.media_domain_settings.allowed_origins
  object_policy_statements = [
    local.media_storage_policy,
  ]
}

module "media_logging_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket"
  bucket_name = "logs.${var.media_domain_settings.domain_name}"
}

module "media_hosting_site" {
  source = "github.com/RLuckom/terraform_modules//aws/cloudfront_s3_website"
  website_buckets = [{
    origin_id = "media.raphaelluckom"
    regional_domain_name = "media.raphaelluckom.com.s3.amazonaws.com"
  }]
  logging_config = local.media_site_cloudfront_logging_config
  route53_zone_name = var.route53_zone_name
  domain_name = var.media_domain_settings.domain_name
  allowed_origins = var.media_domain_settings.allowed_origins
  controlled_domain_part = var.media_domain_settings.domain_name_prefix
  subject_alternative_names = var.media_domain_settings.subject_alternative_names
}
