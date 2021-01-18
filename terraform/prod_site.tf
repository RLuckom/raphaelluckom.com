module "prod_site_plumbing" {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site_plumbing"
  domain_parts = var.prod_domain_parts
  purpose_descriptor = "prod"
  site_bucket = "raphaelluckom.com"
  subject_alternative_names = ["www.raphaelluckom.com"]
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  default_lambda_logging_config = local.prod_site_lambda_logging_config
  site_logging_config = local.prod_site_cloudfront_logging_config 
  trails_table = {
    name = module.prod_trails_table.table.name
    permission_sets = {
      read = module.prod_trails_table.permission_sets.read
      write = module.prod_trails_table.permission_sets.write
      delete_item = module.prod_trails_table.permission_sets.delete_item
    }
  }
  site_description_content = file("./sites/raphaelluckom.com/site_description.json")
  lambda_event_configs = local.notify_failure_only
  route53_zone_name = var.route53_zone_name
  layer_arns = {
    donut_days = module.donut_days.layer.arn,
    markdown_tools =module.markdown_tools.layer.arn,
  }
}

module "prod_trails_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "prod-trails_table"
  partition_key = {
    name = "trailName"
    type = "S"
  }
  range_key = {
    name = "memberKey"
    type = "S"
  }
  global_indexes = [
    {
      name = "reverseDependencyIndex"
      hash_key = "memberKey"
      range_key = "trailName"
      write_capacity = 0
      read_capacity = 0
      projection_type = "ALL"
      non_key_attributes = []
    }
  ]
}

module "prod_website_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_website_bucket"
  domain_parts = var.prod_domain_parts
  additional_allowed_origins = var.prod_additional_allowed_origins

  lambda_notifications = [
    {
      lambda_arn = module.prod_site_plumbing.render_function.arn
      lambda_name = module.prod_site_plumbing.render_function.name
      lambda_role_arn = module.prod_site_plumbing.render_function.role_arn
      permission_type = "put_object"
      events              = ["s3:ObjectCreated:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    },
    {
      lambda_arn = module.prod_site_plumbing.deletion_cleanup_function.arn
      lambda_name = module.prod_site_plumbing.deletion_cleanup_function.name
      lambda_role_arn = module.prod_site_plumbing.deletion_cleanup_function.role_arn
      permission_type = "delete_object"
      events              = ["s3:ObjectRemoved:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    }
  ]
}

module "prod_logging_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket"
  bucket_name = "logs.raphaelluckom.com"
  bucket_policy_statements = [{
    actions = [
      "s3:ListBucket"
    ]
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.archive_cloudfront_logs.role.arn
        ]
      }
    ]
  }]
  object_policy_statements = concat(
    [local.prod_site_cloudfront_logging_policy], 
    [{
      actions = [
        "s3:GetObject",
        "s3:DeleteObject",
      ]
      prefix = ""
      principals = [
        {
          type = "AWS"
          identifiers = [
            module.archive_cloudfront_logs.role.arn
          ]
        }
      ]
    }]
  )
}

module "logs_athena_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_bucket"
  bucket = var.athena_bucket_name
  bucket_policy_statements = [{
    actions = [
      "s3:GetBucketLocation",
      "s3:GetBucketAcl",
      "s3:ListBucket"
    ]
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.archive_cloudfront_logs.role.arn
        ]
      }
    ]
  }]
  object_policy_statements = [{
    actions = [
      "s3:GetObject",
      "s3:ListMultipartUploadParts",
      "s3:PutObject",
    ]
    prefix = ""
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.archive_cloudfront_logs.role.arn
        ]
      }
    ]
  }]
}

module "logs_partition_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_bucket"
  bucket = var.partitioned_bucket_name

  bucket_policy_statements = [
    {
      actions = ["s3:GetBucketAcl"]
      principals = [{
        type = "Service"
        identifiers = ["logs.amazonaws.com" ]
      }]
    }]

    object_policy_statements = [{
      actions = ["s3:PutObject"]
      prefix = ""
      principals = [
        {
          type = "Service"
          identifiers = ["logs.amazonaws.com" ]
        },
        {
          type = "AWS"
          identifiers = [
            module.archive_cloudfront_logs.role.arn
          ]
        }
      ]
    }
  ]
}

resource "aws_glue_catalog_database" "time_series_database" {
  name = var.time_series_db_name
}

module "archive_cloudfront_logs" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  timeout_secs = 40
  mem_mb = 256
  environment_var_map = {
    INPUT_BUCKET = module.prod_logging_bucket.bucket.id
    PARTITION_BUCKET = module.logs_partition_bucket.bucket.id
    PARTITION_PREFIX = "partitioned/raphaelluckom.com"
    ATHENA_RESULT_BUCKET = "s3://${module.logs_athena_bucket.bucket.id}"
    ATHENA_TABLE = module.cloudformation_logs_glue_table.table.name 
    ATHENA_DB = module.cloudformation_logs_glue_table.table.database_name
    ATHENA_REGION = var.athena_region
  }
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/libraries/src/entrypoints/cloudfrontExports.js") 
    } 
  ]
  lambda_details = {
    action_name = "archive_cloudfront_logs"
    scope_name = var.domain_name_prefix
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements =  concat(
      local.permission_sets.athena_query, 
      module.cloudformation_logs_glue_table.permission_sets.create_partition_glue_permissions,
    )
  }
  lambda_event_configs = local.notify_failure_only
  layers = [module.donut_days.layer.arn]

  bucket_notifications = [{
    bucket = module.prod_logging_bucket.bucket.id
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ""
  }]
}

module "cloudformation_logs_glue_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_glue_table"
  table_name          = "${var.domain_name_prefix}_cf_logs_partitioned_gz"
  external_storage_bucket_id = module.logs_partition_bucket.bucket.id
  partition_prefix = "partitioned/raphaelluckom.com"
  db = {
    name = aws_glue_catalog_database.time_series_database.name
    arn = aws_glue_catalog_database.time_series_database.arn
  }
  skip_header_line_count = 2
  ser_de_info = {
    name                  = "${var.domain_name_prefix}_cf_logs"
    serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
    parameters = {
      "field.delim"="\t"
      "serialization.format"="\t"
    }
  }
  columns = module.temporary_schemas.cloudfront_access_log_columns
}
