module media_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/website_bucket"
  domain_parts = {
    top_level_domain = "com"
    controlled_domain_part = "media.raphaelluckom"
  }
  name = module.visibility_system.serverless_site_configs["media"].domain
  additional_allowed_origins = ["http://localhost*", "https://raphaelluckom.com", "https://www.raphaelluckom.com"]
  allow_direct_access = true
  prefix_object_permissions = [
    {
      prefix = ""
      permission_type = "put_object"
      arns = [module.image_archive_lambda.role.arn]
    },
  ]
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

  lambda_notifications = local.media_input_trigger_jpeg
}

module media_table {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "media"
  put_item_permission_role_names = [
    module.image_archive_lambda.role.name
  ]
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
  put_item_permission_role_names = [
    module.image_archive_lambda.role.name
  ]
}

module photos_media_output_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/bucket"
  name = local.media_output_bucket_name
  prefix_object_permissions = [
    {
      prefix = ""
      permission_type = "put_object"
      arns = [module.image_archive_lambda.role.arn]
    },
  ]
}

module image_archive_lambda {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  mem_mb = 512
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/libraries/src/entrypoints/event_configured_donut_days.js")
    },
    {
      file_name = "dependencyHelpers.js"
      file_contents = file("./functions/libraries/src/dependencyhelpers/imageDependencyHelpers.js")
    },
    {
      file_name = "utils.js"
      file_contents = file("./functions/libraries/src/utils.js") 
    }, 
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/configs/imagePipelineConfig.js",
      {
        photo_input_bucket = module.media_input_bucket.bucket.id
        media_storage_bucket = module.photos_media_output_bucket.bucket.id
        media_storage_prefix = "images"
        media_dynamo_table = module.media_table.table.name
        labeled_media_dynamo_table = module.labeled_media_table.table.name
        media_hosting_bucket = module.media_bucket.bucket.id
        post_input_bucket_name = ""
        slack_credentials_parameterstore_key = var.slack_credentials_parameterstore_key
      })
    },
  ]
  lambda_event_configs = local.notify_failure_only
  lambda_details = {
    action_name = "image_archive"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      local.permission_sets.read_slack_credentials,
      local.permission_sets.rekognition_image_analysis,
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [
    module.donut_days.layer_config,
    module.image_dependencies.layer_config
  ]
}
