module "logs_athena_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
  bucket = var.athena_bucket_name
}

module "logs_partition_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
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
    INPUT_BUCKET = module.prod_site.logging_bucket.bucket.bucket.id
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
      module.prod_site.logging_bucket.bucket.permission_sets.move_objects_out,
      module.logs_partition_bucket.permission_sets.put_object
    )
  }
  lambda_event_configs = local.notify_failure_only
  layers = [module.donut_days.layer.arn]

  bucket_notifications = [{
    bucket = module.prod_site.logging_bucket.bucket.bucket.id
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ""
  }]
}

module "cloudformation_logs_glue_table" {
  source = "github.com/RLuckom/terraform_modules//aws/standard_glue_table"
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
  columns = local.cloudfront_access_log_schema.columns
}

module "cloudwatch_logs_glue_table" {
  source = "github.com/RLuckom/terraform_modules//aws/standard_glue_table"
  table_name          = var.cloudwatch_logs_table_name
  db = {
    name = aws_glue_catalog_database.time_series_database.name
    arn = aws_glue_catalog_database.time_series_database.arn
  }
  stored_as_sub_directories = true
  external_storage_bucket_id = module.logs_partition_bucket.bucket.id
  partition_prefix = "partitioned/cloudwatch"
  ser_de_info = {
    name                  = "grok-ser-de"
    serialization_library = "com.amazonaws.glue.serde.GrokSerDe"
    parameters = {
      "input.format"="%%{TIMESTAMP_ISO8601:ingestTime} %%{GREEDYDATA:syslogMessage}"
    }
  }
  partition_keys = local.generic_cloudwatch_logs_schema.partition_keys
  columns = local.generic_cloudwatch_logs_schema.columns
}

module "log_export_lambda" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  source_contents = [
    {
      file_contents = templatefile("./functions/configs/log_exports/config.js", {
        log_export_destination_bucket = module.logs_partition_bucket.bucket.id
        partition_prefix = var.cloudwatch_partition_prefix
        athena_db = aws_glue_catalog_database.time_series_database.name
        athena_table = var.cloudwatch_logs_table_name
        athena_result_bucket = "s3://${module.logs_athena_bucket.bucket.id}/"
      })
      file_name = "config.js"
    },
    {
      file_name = "index.js"
      file_contents = file("./functions/libraries/src/entrypoints/cloudwatchExports.js") 
    } 
  ]
  lambda_details = {
    action_name = "log_export"
    scope_name = "cloudwatch"
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat( 
      local.permission_sets.athena_query,
      local.permission_sets.create_log_exports,
      local.permission_sets.cloudwatch_log_read, 
      module.cloudwatch_logs_glue_table.permission_sets.create_partition_glue_permissions,
      module.logs_athena_bucket.permission_sets.athena_query_execution,
      module.logs_partition_bucket.permission_sets.get_bucket_acl,
      module.logs_partition_bucket.permission_sets.put_object,
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = true
  }
  lambda_event_configs = local.notify_failure_only
  self_invoke = {
    allowed = true
    concurrent_executions = 3
  }
  timeout_secs = 50
  layers = [module.donut_days.layer.arn]
  cron_notifications = [{
    period_expression = "cron(0 1 * * ? *)"
  }]
}
