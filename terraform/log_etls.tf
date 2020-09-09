resource "aws_s3_bucket" "athena_bucket" {
  bucket = var.athena_bucket_name

  tags = {
    Name        = "athena"
  }
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

module "site_logs_etl" {
  source = "./modules/s3_logs_etl"
  name_stem = "log-rotation-${var.domain_name_prefix}"
  time_series_db = {
    name = aws_glue_catalog_database.time_series_database.name
    arn = aws_glue_catalog_database.time_series_database.arn
  }
  time_series_table_name          = "${var.domain_name_prefix}_cf_logs_partitioned_gz"
  lambda_code_bucket = aws_s3_bucket.lambda_bucket.id
  lambda_code_key = "log-rotator/log-rotator.zip"
  timeout_secs = 40
  mem_mb = 256
  input_bucket = module.static_site.logging_bucket_id
  input_bucket_arn = module.static_site.logging_bucket_arn
  partition_bucket = aws_s3_bucket.partition_bucket.id
  partition_bucket_arn = aws_s3_bucket.partition_bucket.arn
  metadata_bucket_arn = aws_s3_bucket.partition_bucket.arn
  metadata_bucket = aws_s3_bucket.partition_bucket.id
  partition_prefix = "${var.partition_prefix}/${var.domain_name}"
  athena_region = var.athena_region
  athena_result_bucket = aws_s3_bucket.athena_bucket.id
  athena_result_bucket_arn = aws_s3_bucket.athena_bucket.arn
  skip_header_line_count = 2
  ser_de_info = {
    name                  = "${var.domain_name_prefix}_cf_logs"
    serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
    parameters = {
      "field.delim"="\t"
      "serialization.format"="\t"
    }
  }

  columns = [
    {
      name = "date"
      type = "date"
    },
    {
      name = "time"
      type = "string"
    },
    {
      name = "location"
      type = "string"
    },
    {
      name = "bytes"
      type = "bigint"
    },
    {
      name = "requestip"
      type = "string"
    },
    {
      name = "method"
      type = "string"
    },
    {
      name = "host"
      type = "string"
    },
    {
      name = "uri"
      type = "string"
    },
    {
      name = "status"
      type = "int"
    },
    {
      name = "referrer"
      type = "string"
    },
    {
      name = "useragent"
      type = "string"
    },
    {
      name = "querystring"
      type = "string"
    },
    {
      name = "cookie"
      type = "string"
    },
    {
      name = "resulttype"
      type = "string"
    },
    {
      name = "requestid"
      type = "string"
    },
    {
      name = "hostheader"
      type = "string"
    },
    {
      name = "requestprotocol"
      type = "string"
    },
    {
      name = "requestbytes"
      type = "bigint"
    },
    {
      name = "timetaken"
      type = "float"
    },
    {
      name = "xforwardedfor"
      type = "string"
    },
    {
      name = "sslprotocol"
      type = "string"
    },
    {
      name = "sslcipher"
      type = "string"
    },
    {
      name = "responseresulttype"
      type = "string"
    },
    {
      name = "httpversion"
      type = "string"
    },
    {
      name = "filestatus"
      type = "string"
    },
    {
      name = "encryptedfields"
      type = "int"
    },
    {
      name = "port"
      type = "int"
    },
    {
      name = "ttfb"
      type = "float"
    },
    {
      name = "detailedresulttype"
      type = "string"
    },
    {
      name = "contenttype"
      type = "string"
    },
    {
      name = "contentlength"
      type = "bigint"
    },
    {
      name = "rangestart"
      type = "bigint"
    },
    {
      name = "rangeend"
      type = "bigint"
    }
  ]
}

module "log_export_notification_lambda" {
  source = "./modules/cron_triggered_lambda"
  name_stem = "log_export_notification"
  lambda_code_bucket = aws_s3_bucket.lambda_bucket.id
  lambda_code_key = "log_export_notification/lambda.zip"
  environment_var_map = {
    "ATHENA_REGION" = var.athena_region
    "PARTITION_BUCKET" = aws_s3_bucket.partition_bucket.id
    "PARTITION_PREFIX" = var.cloudwatch_partition_prefix
    "ATHENA_DB" = aws_glue_catalog_database.time_series_database.name
    "ATHENA_TABLE" = var.cloudwatch_logs_table_name
    ATHENA_RESULT_BUCKET = "s3://${aws_s3_bucket.athena_bucket.id}/"
    "QUEUE_URL" = aws_sqs_queue.pending_cloudwatch_exports.id
  }
  period_expression = "cron(0 1 * * ? *)"
  lambda_iam_policy = concat(var.cloudwatch_log_read_policy, var.athena_query_policy,
  [
    {
      actions = ["sqs:sendMessage"]
      resources = [aws_sqs_queue.pending_cloudwatch_exports.arn]
    },
    {
      actions = ["s3:GetBucketAcl"]
      resources = [aws_s3_bucket.athena_bucket.arn]
    },
    {
      actions   =  [
        "s3:GetObject",
        "s3:ListMultipartUploadParts",
        "s3:PutObject",
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ]
      resources = [
        aws_s3_bucket.athena_bucket.arn,
        "${aws_s3_bucket.athena_bucket.arn}/*"
      ]
    },
    {
      actions   =  [
        "glue:CreatePartition",
        "glue:GetTable",
        "glue:GetDatabase",
        "glue:BatchCreatePartition"
      ]
      resources = [
        aws_glue_catalog_database.time_series_database.arn,
        module.cloudwatch_logs_glue_table.table.arn,
        "arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog",
        "arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog*"
      ]
    }
  ])
}
data "aws_caller_identity" "current" {}

resource "aws_sqs_queue" "log_etl_dead_letter" {
  name                      = "log-etl-dead-letter"
}

resource "aws_sqs_queue" "pending_cloudwatch_exports" {
  name                      = "pending_cloudwatch_exports"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.log_etl_dead_letter.arn
    maxReceiveCount     = 16
  })
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.pending_cloudwatch_exports.arn
  function_name    = module.log_export_queue_consumer.lambda.arn
  batch_size = 1
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
  lambda_details = {
    name = "log_export_queue_consumer"
    bucket = aws_s3_bucket.lambda_bucket.id
    key = "log_export_consumer/lambda.zip"
    reserved_concurrent_executions = 1
    policy_statements = [
      {
        actions = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        resources = [aws_sqs_queue.pending_cloudwatch_exports.arn]
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
    invoking_principal = {
      service =  "sqs.amazonaws.com"
      source_arn = aws_sqs_queue.pending_cloudwatch_exports.arn
    }
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
  db_name = aws_glue_catalog_database.time_series_database.name
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
  partition_keys = [
  {
    name = "year"
    type = "string"
  },
  {
    name = "month"
    type = "string"
  },
  {
    name = "day"
    type = "string"
  },
  {
    name = "service"
    type = "string"
  },
  {
    name = "sourcename"
    type = "string"
  }
  ]

  columns = [
    {
      name = "ingesttime"
      type = "string"
    },
    {
      name = "logmessage"
      type = "string"
    }
    ]
}
