module "lambda_role" {
  source = "../permissioned_role"
  role_name = "${var.lambda_details.name}-lambda"
  role_policy = concat(var.deny_cloudwatch ? [] : var.log_writer_policy, var.lambda_details.policy_statements)
  principals = [{
    type = "Service"
    identifiers = ["lambda.amazonaws.com"]
  }]
}

resource "aws_lambda_function" "lambda" {
  function_name = var.lambda_details.name
  s3_bucket = var.lambda_details.bucket
	s3_key = var.lambda_details.key
  role          = module.lambda_role.role.arn
  handler       = var.handler
	timeout = var.timeout_secs
	memory_size = var.mem_mb

  runtime = "nodejs12.x"
  environment {
    variables = var.environment_var_map
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
	name              = "/aws/lambda/${aws_lambda_function.lambda.function_name}"
	retention_in_days = var.log_retention_period
}

resource "aws_lambda_permission" "allow_caller" {
  statement_id  = "AllowExecution"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  principal     = var.lambda_details.invoking_principal.service
  source_arn = var.lambda_details.invoking_principal.source_arn
}
