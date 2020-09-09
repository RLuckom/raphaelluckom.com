data "aws_caller_identity" "current" {}
module "permissioned_lambda" {
  source = "../permissioned_lambda"
  timeout_secs = var.timeout_secs
  mem_mb = var.mem_mb
  environment_var_map = {
    INPUT_BUCKET = var.input_bucket == "" ? aws_s3_bucket.input_bucket[0].id : var.input_bucket
    INPUT_PREFIX = var.input_prefix
    PARTITION_BUCKET = var.partition_bucket == "" ? aws_s3_bucket.partition_bucket[0].id : var.partition_bucket
    PARTITION_PREFIX = var.partition_prefix
    METADATA_PARTITION_BUCKET = var.metadata_bucket_arn == "" ? aws_s3_bucket.metadata_bucket[0].id : ""
    METADATA_PARTITION_PREFIX = var.metadata_partition_prefix
    ATHENA_RESULT_BUCKET = var.athena_result_bucket == "" ? aws_s3_bucket.athena_result_bucket[0].id : "s3://${var.athena_result_bucket}"
    ATHENA_TABLE = aws_glue_catalog_table.cloudformation_logs_glue_table.name 
    ATHENA_DB = aws_glue_catalog_table.cloudformation_logs_glue_table.database_name
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
			"${var.input_bucket_arn == "" ? aws_s3_bucket.input_bucket[0].arn : var.input_bucket_arn}",
			"${var.input_bucket_arn == "" ? aws_s3_bucket.input_bucket[0].arn : var.input_bucket_arn}/*"
		]
	}
	,{
		actions   =  [
			"s3:GetObject",
			"s3:ListMultipartUploadParts",
			"s3:PutObject",
			"s3:GetBucketLocation",
			"s3:ListBucket"
		]
		resources = [
			"${var.athena_result_bucket_arn == "" ? aws_s3_bucket.athena_result_bucket[0].arn : var.athena_result_bucket_arn}",
			"${var.athena_result_bucket_arn == "" ? aws_s3_bucket.athena_result_bucket[0].arn : var.athena_result_bucket_arn}/*"
		]
	}

	,{
		actions   =  [
			"glue:CreatePartition",
			"glue:GetTable",
			"glue:GetDatabase",
			"glue:BatchCreatePartition"
		]
		resources = [
			"${var.time_series_db.arn}",
			"${aws_glue_catalog_table.cloudformation_logs_glue_table.arn}",
			"arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog",
			"arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog*"
		]
	}
	,{
		actions   =  [
			"athena:StartQueryExecution",
			"athena:GetQueryResults",
			"athena:GetQueryExecution"
		]
		resources = [
			"arn:aws:athena:*"
		]
	}
	,{
		actions   =  [
			"s3:PutObject"
		]
		resources = [
			"${var.metadata_bucket_arn == "" ?  aws_s3_bucket.metadata_bucket[0].arn : var.metadata_bucket_arn}/*",
			"${var.partition_bucket_arn == "" ?  aws_s3_bucket.partition_bucket[0].arn : var.partition_bucket_arn}/*",
			"${var.athena_result_bucket_arn == "" ?  aws_s3_bucket.athena_result_bucket[0].arn : var.athena_result_bucket_arn}/*"
		]
	}])
    invoking_principal = {
      service     = "s3.amazonaws.com"
      source_arn    = var.input_bucket_arn == "" ?  aws_s3_bucket.input_bucket[0].arn : var.input_bucket_arn
    }
  }
}

resource "aws_s3_bucket" "input_bucket" {
	count = var.input_bucket == "" ? 1 : 0
	bucket = "${replace(var.name_stem, "_", ".")}.input"
}

resource "aws_s3_bucket" "athena_result_bucket" {
	count = var.athena_result_bucket == "" ? 1 : 0
	bucket = "${replace(var.name_stem, "_", ".")}.athena"
}

resource "aws_s3_bucket" "partition_bucket" {
	count = var.partition_bucket == "" ? 1 : 0
	bucket = "${replace(var.name_stem, "_", ".")}.partition"
}

resource "aws_s3_bucket" "metadata_bucket" {
	count = var.metadata_bucket_arn == "" ? 1 : 0
	bucket = "${replace(var.name_stem, "_", ".")}.metadata"
}

resource "aws_s3_bucket_notification" "bucket_notification" {
	bucket = var.input_bucket == "" ? aws_s3_bucket.input_bucket[0].id : var.input_bucket

	lambda_function {
    lambda_function_arn = module.permissioned_lambda.lambda.arn
		events              = ["s3:ObjectCreated:*"]
		filter_prefix       = var.input_prefix
		filter_suffix       = var.input_suffix
	}

}
