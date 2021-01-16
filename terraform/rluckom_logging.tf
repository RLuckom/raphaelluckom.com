locals {
  log_bucket_name = "${var.bucket_prefix}-logs"
  test_logging_config = {
    bucket = local.log_bucket_name
    prefix = "test"
    debug = false
  }
  test_logging_bucket_policy = {
    prefix = local.test_logging_config.prefix
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
}

module logging_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket?ref=hoist-bucket-permissions"
  bucket_name = local.log_bucket_name
  object_policy_statements = [
    local.test_logging_bucket_policy
  ]
}
