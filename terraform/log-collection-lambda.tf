data "aws_caller_identity" "current" {}

module "log_rotator_lambda" {
  source = "./modules/cron_triggered_lambda"
  lambda_name_stem = "log-rotation-${var.domain_name_prefix}"
  lambda_code_bucket = aws_s3_bucket.lambda_bucket.id
  lambda_code_key = "log-rotator/log-rotator.zip"
  timeout_secs = 40
  mem_mb = 256
  rotation_period_expression = var.rotation_period_expression
  lambda_env = {
      LOG_BUCKET = module.static_site.logging_bucket_id
      LOG_PREFIX = var.domain_name_prefix
      PARTITION_BUCKET = aws_s3_bucket.partition_bucket.id
      PARTITION_PREFIX = "${var.partition_prefix}/${var.domain_name}"
      ATHENA_RESULT_BUCKET = "s3://${aws_s3_bucket.athena_bucket.id}/raphaelluckom.com"
      ATHENA_TABLE = aws_glue_catalog_table.cloudformation_logs_glue_table.name 
      ATHENA_DB = aws_glue_catalog_table.cloudformation_logs_glue_table.database_name
      ATHENA_REGION = var.athena_region
    }
  lambda_iam_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Effect": "Allow",
      "Resource": [
        "${module.static_site.logging_bucket_arn}",
        "${module.static_site.logging_bucket_arn}/*"
      ]
    },
    {
      "Action": [
        "s3:GetObject",
        "s3:ListMultipartUploadParts",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Effect": "Allow",
      "Resource": [
        "${aws_s3_bucket.athena_bucket.arn}",
        "${aws_s3_bucket.athena_bucket.arn}/*"
      ]
    },
    {
      "Action": [
        "glue:CreatePartition",
        "glue:GetTable",
        "glue:GetDatabase",
        "glue:BatchCreatePartition"
      ],
      "Effect": "Allow",
      "Resource": [
        "${aws_glue_catalog_database.time_series_database.arn}",
        "${aws_glue_catalog_table.cloudformation_logs_glue_table.arn}",
        "arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog",
        "arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog*"
      ]
    },
    {
      "Action": [
        "athena:StartQueryExecution",
        "athena:GetQueryResults",
        "athena:GetQueryExecution"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:athena:*"
      ]
    },
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    },
    {
      "Action": [
        "s3:PutObject"
      ],
      "Effect": "Allow",
      "Resource": [
        "${aws_s3_bucket.partition_bucket.arn}/*"
      ]
    }
  ]
}
POLICY
}
