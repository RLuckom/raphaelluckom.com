data "aws_caller_identity" "current" {}
data "aws_iam_policy_document" "lamda_policy" {
	statement {
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
	statement {
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

	statement {
		actions   =  [
			"glue:CreatePartition",
			"glue:GetTable",
			"glue:GetDatabase",
			"glue:BatchCreatePartition"
		]
		resources = [
			"${aws_glue_catalog_database.time_series_database.arn}",
			"${aws_glue_catalog_table.cloudformation_logs_glue_table.arn}",
			"arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog",
			"arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog*"
		]
	}
	statement {
		actions   =  [
			"athena:StartQueryExecution",
			"athena:GetQueryResults",
			"athena:GetQueryExecution"
		]
		resources = [
			"arn:aws:athena:*"
		]
	}
	statement {
		actions   =  [
			"logs:CreateLogGroup",
			"logs:CreateLogStream",
			"logs:PutLogEvents"
		]
		resources = [
			"arn:aws:logs:*:*:*",
		]
	}
	statement {
		actions   =  [
			"s3:PutObject"
		]
		resources = [
			"${var.metadata_bucket_arn == "" ?  aws_s3_bucket.metadata_bucket[0].arn : var.metadata_bucket_arn}/*",
			"${var.partition_bucket_arn == "" ?  aws_s3_bucket.partition_bucket[0].arn : var.partition_bucket_arn}/*",
			"${var.athena_result_bucket_arn == "" ?  aws_s3_bucket.athena_result_bucket[0].arn : var.athena_result_bucket_arn}/*"
		]
	}

	dynamic "statement" {
		for_each = var.statements
		content {
			actions = statement.value["actions"]
			resources = statement.value["resources"]
		}
	}
}


resource "aws_iam_policy" "lambda_policy" {
	name = "lambda-policy-${var.name_stem}"

	policy = data.aws_iam_policy_document.lamda_policy.json


}

resource "aws_iam_role_policy_attachment" "lambda_attachment" {
	role       = aws_iam_role.lambda_role.name
	policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_role" "lambda_role" {
	name = "lambda-role-${var.name_stem}"

	assume_role_policy = <<EOF
	{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Action": "sts:AssumeRole",
				"Principal": {
					"Service": "lambda.amazonaws.com"
				},
				"Effect": "Allow",
				"Sid": ""
			}
		]
	}
	EOF
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
	name              = "/aws/lambda/${aws_lambda_function.lambda.function_name}"
	retention_in_days = 14
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

resource "aws_lambda_function" "lambda" {
	s3_bucket = var.lambda_code_bucket
	s3_key = var.lambda_code_key
	function_name = replace(var.name_stem, ".", "-")
	role          = aws_iam_role.lambda_role.arn
	handler       = var.handler

	runtime = "nodejs12.x"
	timeout = var.timeout_secs
	memory_size = var.mem_mb

	environment {
		variables =  {
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
	}
}

resource "aws_lambda_permission" "allow_bucket" {
	statement_id  = "AllowExecutionFromS3Bucket"
	action        = "lambda:InvokeFunction"
	function_name = aws_lambda_function.lambda.arn
	principal     = "s3.amazonaws.com"
	source_arn    = var.input_bucket_arn == "" ?  aws_s3_bucket.input_bucket[0].arn : var.input_bucket_arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
	bucket = var.input_bucket == "" ? aws_s3_bucket.input_bucket[0].id : var.input_bucket

	lambda_function {
		lambda_function_arn = aws_lambda_function.lambda.arn
		events              = ["s3:ObjectCreated:*"]
		filter_prefix       = var.input_prefix
		filter_suffix       = var.input_suffix
	}

	depends_on = [aws_lambda_permission.allow_bucket]
}
