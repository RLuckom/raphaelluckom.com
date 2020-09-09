data "aws_caller_identity" "current" {}

module "permissioned_lambda" {
  source = "../permissioned_lambda"
  timeout_secs = var.timeout_secs
  mem_mb = var.mem_mb
  environment_var_map = {
    INPUT_BUCKET = aws_s3_bucket.input_bucket.id
    INPUT_PREFIX = var.input_prefix
    PARTITION_BUCKET = aws_s3_bucket.partition_bucket.id
    PARTITION_PREFIX = var.partition_prefix
    METADATA_PARTITION_BUCKET = module.cloudformation_logs_glue_table.metadata_bucket.id,
    METADATA_PARTITION_PREFIX = var.metadata_partition_prefix
    ATHENA_RESULT_BUCKET = aws_s3_bucket.athena_result_bucket.id
    ATHENA_TABLE = module.cloudformation_logs_glue_table.table.name 
    ATHENA_DB = module.cloudformation_logs_glue_table.table.database_name
    ATHENA_REGION = var.athena_region
  }
  lambda_details = {
    name = "${var.name_stem}-lambda"
    bucket = var.lambda_code_bucket
    key = var.lambda_code_key
    policy_statements = concat(var.statements, [{
      actions   =  [
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      resources = [
        aws_s3_bucket.input_bucket.arn,
        "${aws_s3_bucket.input_bucket.arn}/*"
      ]
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
        aws_s3_bucket.athena_result_bucket.arn,
        "${aws_s3_bucket.athena_result_bucket.arn}/*"
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
        var.db.arn,
        module.cloudformation_logs_glue_table.table.arn,
        "arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog",
        "arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog*"
      ]
    },
    {
      actions   =  [
        "s3:PutObject"
      ]
      resources = [
        "${module.cloudformation_logs_glue_table.metadata_bucket.arn}/*",
        "${aws_s3_bucket.partition_bucket.arn}/*",
        "${aws_s3_bucket.athena_result_bucket.arn}/*"
      ]
    }])
    invoking_principal = {
      service     = "s3.amazonaws.com"
      source_arn    = aws_s3_bucket.input_bucket.arn
    }
  }
}

resource "aws_s3_bucket" "input_bucket" {
  bucket = "${replace(var.name_stem, "_", ".")}.input"
}

resource "aws_s3_bucket" "athena_result_bucket" {
  bucket = "${replace(var.name_stem, "_", ".")}.athena"
}

resource "aws_s3_bucket" "partition_bucket" {
  bucket = "${replace(var.name_stem, "_", ".")}.partition"
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.input_bucket.id

  lambda_function {
    lambda_function_arn = module.permissioned_lambda.lambda.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = var.input_prefix
    filter_suffix       = var.input_suffix
  }
}
