module visibility_data_coordinator {
  source = "github.com/RLuckom/terraform_modules//aws/coordinators/visibility_data?ref=tape-deck-storage"
  scopes = ["test", "prod"]
  cloudfront_delivery_bucket = "${var.bucket_prefix}-cloudfront-delivery"
  visibility_data_bucket = "${var.bucket_prefix}-visibility-data"
  lambda_source_bucket = "${var.bucket_prefix}-visibility-data"
  cloudfront_distributions = {
    prod = {
      top_level_domain = "com"
      controlled_domain_part = "raphaelluckom"
    }
    test = {
      top_level_domain = "com"
      controlled_domain_part = "test.raphaelluckom"
    }
    media = {
      top_level_domain = "com"
      controlled_domain_part = "media.raphaelluckom"
    }
  }
}

module log_delivery_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket?ref=tape-deck-storage"
  bucket_name = module.visibility_data_coordinator.cloudfront_delivery_bucket
}

module visibility_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/visibility_data_bucket?ref=tape-deck-storage"
  bucket_name = module.visibility_data_coordinator.visibility_data_bucket
  prefix_put_permissions = [{
    prefix = module.visibility_data_coordinator.lambda_log_configs["test"].log_prefix,
    arns = module.test_site_plumbing.logging_lambda_role_arns
  }]
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
  test_site_lambda_logging_config = {
    bucket = local.visibility_bucket_name
    prefix = "test"
    debug = false
  }
  test_site_lambda_logging_policy = {
    prefix = local.test_site_lambda_logging_config.prefix
    actions = ["s3:PutObject"]
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.test_site_plumbing.render_function.role_arn,
          module.test_site_plumbing.deletion_cleanup_function.role_arn,
          module.test_site_plumbing.trails_resolver_function.role_arn,
          module.test_site_plumbing.trails_updater_function.role_arn
        ]
      }
    ]
  }
  test_site_cloudfront_logging_config = {
    bucket = local.visibility_bucket_name
    prefix = "test.raphaelluckom.com"
    include_cookies = false
  }
  test_site_cloudfront_logging_policy = {
    prefix = local.test_site_cloudfront_logging_config.prefix
    actions = ["s3:PutObject"]
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.test_site_plumbing.cloudfront_log_delivery_identity.iam_arn
        ]
      }
    ]
  }
  prod_site_lambda_logging_config = {
    bucket = local.visibility_bucket_name
    prefix = "prod"
    debug = false
  }
  prod_site_lambda_logging_policy = {
    prefix = local.prod_site_lambda_logging_config.prefix
    actions = ["s3:PutObject"]
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.prod_site_plumbing.render_function.role_arn,
          module.prod_site_plumbing.deletion_cleanup_function.role_arn,
          module.prod_site_plumbing.trails_resolver_function.role_arn,
          module.prod_site_plumbing.trails_updater_function.role_arn
        ]
      }
    ]
  }
  prod_site_cloudfront_logging_config = {
    bucket = "logs.raphaelluckom.com"
    prefix = "raphaelluckom"
    include_cookies = false
  }
  prod_site_cloudfront_logging_policy = {
    prefix = local.prod_site_cloudfront_logging_config.prefix
    actions = ["s3:PutObject"]
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.prod_site_plumbing.cloudfront_log_delivery_identity.iam_arn
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
    prefix = local.prod_site_cloudfront_logging_config.prefix
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
  test_glue_pipe_logging_config = {
    prefix = "test-glue-pipeline"
    bucket = local.visibility_bucket_name
  }
}
