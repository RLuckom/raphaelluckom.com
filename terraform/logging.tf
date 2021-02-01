/*
The visibility data coordinator creates no infrastructure, but sets the names
of shared data infrastructure. This allows us to avoid circular references--
cases where we need to know the logging location to build a function, but need the function
ID to allow it access to the logging location.
*/
module visibility_data_coordinator {
  source = "github.com/RLuckom/terraform_modules//aws/visibility/aurochs"
  scopes = ["test", "prod"]
  scoped_logging_functions = {
    prod = module.prod_site.lambda_logging_prefix_role_map
    test = module.test_site.lambda_logging_prefix_role_map
  }
  cloudfront_delivery_bucket = "${var.bucket_prefix}-cloudfront-delivery"
  visibility_data_bucket = "${var.bucket_prefix}-visibility-data"
  lambda_source_bucket = aws_s3_bucket.lambda_bucket.id
  donut_days_layer = module.donut_days.layer_config
  lambda_event_configs = local.notify_failure_only
  serverless_site_configs = {
    prod = {
      scope = "prod"
      top_level_domain = "com"
      controlled_domain_part = "raphaelluckom"
    }
    test = {
      scope = "test"
      top_level_domain = "com"
      controlled_domain_part = "test.raphaelluckom"
    }
    media = {
      scope = "prod"
      top_level_domain = "com"
      controlled_domain_part = "media.raphaelluckom"
    }
  }
}

locals {
  athena_bucket_name = var.athena_bucket_name
  cloudfront_delivery_bucket_name = "${var.bucket_prefix}-visibility-data"
  visibility_bucket_name = "${var.bucket_prefix}-visibility-data"
  media_output_bucket_name = "rluckom.photos.partition"
  media_storage_config = {
    bucket = local.media_output_bucket_name
    prefix = ""
    debug = false
  }
  media_storage_policy = {
    prefix = local.media_storage_config.prefix
    actions = ["s3:PutObject"]
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.image_archive_lambda.role.arn,
        ]
      }
    ]
  }
  media_site_cloudfront_logging_config = {
    bucket = local.visibility_bucket_name
    prefix = "media.raphaelluckom"
    include_cookies = false
  }
  media_site_cloudfront_logging_policy = {
    prefix = "media"
    actions = ["s3:PutObject"]
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.media_hosting_site.cloudfront_log_delivery_identity.iam_arn
        ]
      }
    ]
  }
}
