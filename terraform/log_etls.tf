module "logs_athena_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_bucket"
  bucket = var.athena_bucket_name
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
      principals = [{
        type = "Service"
        identifiers = ["logs.amazonaws.com" ]
      }]
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
      module.logs_athena_bucket.permission_sets.athena_query_execution,
      module.prod_logging_bucket.permission_sets.move_objects_out,
      module.logs_partition_bucket.permission_sets.put_object
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
