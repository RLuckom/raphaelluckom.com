module "logs_athena_bucket" {
  source = "./modules/permissioned_bucket"
  bucket = var.athena_bucket_name
}

resource "aws_s3_bucket" "partition_bucket" {
  bucket = var.partitioned_bucket_name
  tags = {
    Name        = "partitioned"
  }
}

resource "aws_glue_catalog_database" "time_series_database" {
  name = var.time_series_db_name
}

module "log_etl_lambda" {
  source = "./modules/permissioned_lambda"
  timeout_secs = 40
  mem_mb = 256
  environment_var_map = {
    INPUT_BUCKET = module.static_site.logging_bucket.bucket.id
    INPUT_PREFIX = ""
    PARTITION_BUCKET = aws_s3_bucket.partition_bucket.id
    PARTITION_PREFIX = "partitioned/raphaelluckom.com"
    METADATA_PARTITION_BUCKET = ""
    METADATA_PARTITION_PREFIX = ""
    ATHENA_RESULT_BUCKET = "s3://${module.logs_athena_bucket.bucket.id}"
    ATHENA_TABLE = module.cloudformation_logs_glue_table.table.name 
    ATHENA_DB = module.cloudformation_logs_glue_table.table.database_name
    ATHENA_REGION = var.athena_region
  }
  lambda_details = {
    name = "log-rotation-${var.domain_name_prefix}"
    bucket = aws_s3_bucket.lambda_bucket.id
    key = "log-rotator/log-rotator.zip"
    policy_statements =  concat(
      var.athena_query_policy,
			module.cloudformation_logs_glue_table.permission_sets.create_partition_glue_permissions,
      module.logs_athena_bucket.permission_sets.athena_query_execution,
			module.static_site.logging_bucket.permission_sets.move_objects_out,
      [
	{
		actions   =  [
			"s3:PutObject"
		]
		resources = [
			"${aws_s3_bucket.partition_bucket.arn}/*",
		]
	}])
  }

  bucket_notifications = [{
    bucket = module.static_site.logging_bucket.bucket.id
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ""
  }]
}

module "cloudformation_logs_glue_table" {
  source = "./modules/standard_glue_table"
  table_name          = "${var.domain_name_prefix}_cf_logs_partitioned_gz"
  metadata_bucket_name = aws_s3_bucket.partition_bucket.id
  external_storage_bucket_id = aws_s3_bucket.partition_bucket.id
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

module "log_export_notification_lambda" {
  source = "./modules/permissioned_lambda"
  cron_notifications = [{
    period_expression = "cron(0 1 * * ? *)"
  }]
  environment_var_map = {
    "ATHENA_REGION" = var.athena_region
    "PARTITION_BUCKET" = aws_s3_bucket.partition_bucket.id
    "PARTITION_PREFIX" = var.cloudwatch_partition_prefix
    "ATHENA_DB" = aws_glue_catalog_database.time_series_database.name
    "ATHENA_TABLE" = var.cloudwatch_logs_table_name
    ATHENA_RESULT_BUCKET = "s3://${module.logs_athena_bucket.bucket.id}/"
    "QUEUE_URL" = module.pending_cloudwatch_exports.queue.id
  }
  lambda_details = {
  name = "log_export_notification"
  bucket = aws_s3_bucket.lambda_bucket.id
  key = "log_export_notification/lambda.zip"
  policy_statements = concat(
    var.cloudwatch_log_read_policy, 
    var.athena_query_policy,
    module.cloudwatch_logs_glue_table.permission_sets.create_partition_glue_permissions,
    module.logs_athena_bucket.permission_sets.athena_query_execution,
  [
    {
      actions = ["sqs:sendMessage"]
      resources = [module.pending_cloudwatch_exports.queue.arn]
    }
  ])
}
}

data "aws_caller_identity" "current" {}

module "pending_cloudwatch_exports" {
  source = "./modules/queue_with_deadletter"
  queue_name = "pending_cloudwatch_exports"
  maxReceiveCount = 16
}

data "aws_iam_policy_document" "partition_bucket_policy" {
  statement {
    principals { 
      type = "Service"
      identifiers = ["logs.amazonaws.com" ]
    }
    actions = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.partition_bucket.arn]
  }
  statement {
    principals { 
      type = "Service"
      identifiers = ["logs.amazonaws.com" ]
    }
    actions = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.partition_bucket.arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "partition_bucket_policy" {
  bucket = aws_s3_bucket.partition_bucket.id
  policy = data.aws_iam_policy_document.partition_bucket_policy.json
}

module "log_export_queue_consumer" {
  source = "./modules/permissioned_lambda"
  queue_event_sources = [{
      batch_size = 1
      arn = module.pending_cloudwatch_exports.queue.arn
    }]
  lambda_details = {
    name = "log_export_queue_consumer"
    bucket = aws_s3_bucket.lambda_bucket.id
    key = "log_export_consumer/lambda.zip"
    reserved_concurrent_executions = 1
    policy_statements = [
      {
        actions = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        resources = [module.pending_cloudwatch_exports.queue.arn]
      },
      {
        actions = ["logs:DescribeExportTasks", "logs:CreateExportTask"]
        resources = ["*"]
      },
      {
        actions = ["s3:GetBucketAcl"]
        resources = [aws_s3_bucket.partition_bucket.arn]
      },
      {
        actions = ["s3:PutObject"]
        resources = ["${aws_s3_bucket.partition_bucket.arn}/*"]
      }
    ]
  }
  environment_var_map = {
    "ATHENA_REGION" = var.athena_region
    "PARTITION_BUCKET" = aws_s3_bucket.partition_bucket.id
    "PARTITION_PREFIX" = var.cloudwatch_partition_prefix
  }
}

module "cloudwatch_logs_glue_table" {
  source = "./modules/standard_glue_table"
  table_name          = var.cloudwatch_logs_table_name
  db = {
    name = aws_glue_catalog_database.time_series_database.name
    arn = aws_glue_catalog_database.time_series_database.arn
  }
  stored_as_sub_directories = true
  external_storage_bucket_id = aws_s3_bucket.partition_bucket.id
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
