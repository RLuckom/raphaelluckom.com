/*
The visibility data coordinator creates no infrastructure, but sets the names
of shared data infrastructure. This allows us to avoid circular references--
cases where we need to know the logging location to build a function, but need the function
ID to allow it access to the logging location.
*/
module visibility_data_coordinator {
  source = "github.com/RLuckom/terraform_modules//aws/coordinators/visibility_data"
  scopes = ["test", "prod"]
  cloudfront_delivery_bucket = "${var.bucket_prefix}-cloudfront-delivery"
  visibility_data_bucket = "${var.bucket_prefix}-visibility-data"
  lambda_source_bucket = aws_s3_bucket.lambda_bucket.id
  serverless_site_configs = {
    prod = {
      athena_region = "us-east-1" 
      top_level_domain = "com"
      controlled_domain_part = "raphaelluckom"
    }
    test = {
      athena_region = "us-east-1" 
      top_level_domain = "com"
      controlled_domain_part = "test.raphaelluckom"
    }
    media = {
      athena_region = "us-east-1" 
      top_level_domain = "com"
      controlled_domain_part = "media.raphaelluckom"
    }
  }
}

/*
This is the bucket where cloudfront delivers its logs.
Cloudfront requires full access (create, read, update, delete) to any bucket where it delivers
logs, so we use a dedicated bucket for this instead of giving cloudfront full access to our
permanent data bucket. When cloudfront drops logs into this bucket, an archiver function picks them up
and moves them into the visibility bucket.
*/
module log_delivery_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket"
  bucket_name = module.visibility_data_coordinator.cloudfront_delivery_bucket
  move_objects_out_permissions = [
    {
      prefix = module.visibility_data_coordinator.serverless_site_configs["prod"].cloudfront_log_delivery_prefix
      arns = [module.prod_site_plumbing.archive_function.role_arn]
    },
    {
      prefix = module.visibility_data_coordinator.serverless_site_configs["test"].cloudfront_log_delivery_prefix
      arns = [module.test_site_plumbing.archive_function.role_arn]
    },
  ]
  lambda_notifications = [
    module.test_site_plumbing.archive_function_notification_config
  ]
}

/*
The visibility bucket is where we keep query-able data like cloudfront and lambda logs
*/
module visibility_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/visibility_data_bucket"
  bucket_name = module.visibility_data_coordinator.visibility_data_bucket
  // In the following list, the `prefix` of each record comes from the visibility data
  // coordinator. This protects us from cases where an error in the logging module
  // sets the log prefix incorrectly. By using the prefix from the coordinator, we
  // ensure that writes to any incorrect location will fail.
  prefix_athena_query_permissions = [
    {
      prefix = module.visibility_data_coordinator.serverless_site_configs["prod"].cloudfront_result_prefix
      arns = [
        module.prod_site_plumbing.archive_function.role_arn]
    },
    {
      prefix = module.visibility_data_coordinator.serverless_site_configs["test"].cloudfront_result_prefix
      arns = [
        module.test_site_plumbing.archive_function.role_arn]
    },
  ]
  prefix_put_permissions = [
    {
      prefix = module.visibility_data_coordinator.serverless_site_configs["prod"].cloudfront_log_storage_prefix
      arns = [module.prod_site_plumbing.archive_function.role_arn]
    },
    {
      prefix = module.visibility_data_coordinator.lambda_log_configs["prod"].log_prefix,
      arns = module.prod_site_plumbing.logging_lambda_role_arns
    },
    {
      prefix = module.visibility_data_coordinator.serverless_site_configs["test"].cloudfront_log_storage_prefix
      arns = [module.test_site_plumbing.archive_function.role_arn]
    },
    {
      prefix = module.visibility_data_coordinator.lambda_log_configs["test"].log_prefix,
      arns = module.test_site_plumbing.logging_lambda_role_arns
    },
  ]
  list_bucket_permission_arns = [
    module.test_site_plumbing.archive_function.role_arn,
    module.prod_site_plumbing.archive_function.role_arn
  ]
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
