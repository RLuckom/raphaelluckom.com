module media_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/website_bucket"
  domain_parts = {
    top_level_domain = "com"
    controlled_domain_part = "media.raphaelluckom"
  }
  name = module.visibility_system.serverless_site_configs["media"].domain
  additional_allowed_origins = ["http://localhost*", "https://raphaelluckom.com", "https://www.raphaelluckom.com"]
  allow_direct_access = true
}

module media_hosting_site {
  source = "github.com/RLuckom/terraform_modules//aws/cloudfront_s3_website"
  website_buckets = [{
    origin_id = "media.raphaelluckom"
    regional_domain_name = "media.raphaelluckom.com.s3.amazonaws.com"
  }]
  logging_config = local.media_site_cloudfront_logging_config
  system_id = {
    security_scope = "prod"
    subsystem_name = "media"
  }
  routing = {
    route53_zone_name = var.route53_zone_name
    domain_parts = module.visibility_system.serverless_site_configs["media"].domain_parts
  }
  allowed_origins = ["http://localhost*", "https://raphaelluckom.com", "https://www.raphaelluckom.com"]
  subject_alternative_names = ["www.media.raphaelluckom.com"]
}

module media_input_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/bucket"
  name = "rluckom-media-input"
  lifecycle_rules = [{
    prefix = ""
    tags = {
      processed = "true"
    }
    enabled = true
    expiration_days = 3
  }]

}

module media_table {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "media"
}

module labeled_media_table {
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

module photos_media_output_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/bucket"
  name = local.media_output_bucket_name
}
