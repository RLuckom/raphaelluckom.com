locals {
  log_bucket_name = "${var.bucket_prefix}-logs"
  test_site_lambda_logging_config = {
    bucket = local.log_bucket_name
    prefix = "test"
    debug = false
  }
  test_site_cloudfront_logging_config = {
    bucket = local.log_bucket_name
    prefix = "test.raphaelluckom.com"
    include_cookies = false
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
    bucket = local.log_bucket_name
    prefix = "prod"
    debug = false
  }
  prod_site_cloudfront_logging_config = {
    bucket = "logs.raphaelluckom.com"
    prefix = "raphaelluckom"
    include_cookies = false
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
}

module logging_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket?ref=hoist-bucket-permissions"
  bucket_name = local.log_bucket_name
  object_policy_statements = [
    local.test_site_lambda_logging_policy,
    local.prod_site_lambda_logging_policy
  ]
}
