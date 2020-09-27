module "lambda_role" {
  source = "../permissioned_role"
  role_name = "${local.scoped_lambda_name}-lambda"
  role_policy = concat(var.self_invoke.allowed ? local.lambda_invoke : [], var.deny_cloudwatch ? [] : var.log_writer_policy, var.lambda_details.policy_statements)
  principals = [{
    type = "Service"
    identifiers = ["lambda.amazonaws.com"]
  }]
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  lambda_invoke = [{
    actions   =  [
      "lambda:InvokeFunction"
    ]
    resources = [
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.scoped_lambda_name}"
    ]
  }]
}

resource "aws_lambda_function" "lambda" {
  function_name = local.scoped_lambda_name
  s3_bucket = var.lambda_details.bucket
	s3_key = "${var.lambda_details.action_name}/lambda.zip"
  role          = module.lambda_role.role.arn
  handler       = var.handler
	timeout = var.timeout_secs
  reserved_concurrent_executions = var.self_invoke.allowed ? var.self_invoke.concurrent_executions : var.reserved_concurrent_executions
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

data "aws_s3_bucket" "trigger_bucket" {
  count = length(var.bucket_notifications)
  bucket = var.bucket_notifications[count.index].bucket
}

locals {
  callers = concat(
    var.invoking_principals,
    [ for i, notification in var.bucket_notifications: {
      service = "s3.amazonaws.com"
      source_arn = data.aws_s3_bucket.trigger_bucket[i].arn
    }],
    [ for i, notification in var.cron_notifications: {
      service = "events.amazonaws.com"
      source_arn = aws_cloudwatch_event_rule.lambda_schedule[i].arn
    }],
    [ for event_source in var.queue_event_sources: {
      service = "sqs.amazonaws.com"
      source_arn = event_source.arn
    }]
  )
}

resource "aws_lambda_permission" "allow_caller" {
  count = length(local.callers)
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  principal     = local.callers[count.index].service
  source_arn = local.callers[count.index].source_arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  count = length(var.bucket_notifications)
  bucket = var.bucket_notifications[count.index].bucket

  lambda_function {
    lambda_function_arn = aws_lambda_function.lambda.arn
    events              = var.bucket_notifications[count.index].events
    filter_prefix       = var.bucket_notifications[count.index].filter_prefix
    filter_suffix       = var.bucket_notifications[count.index].filter_suffix
  }
}

resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  count = length(var.cron_notifications)
  schedule_expression = var.cron_notifications[count.index].period_expression
}

resource "aws_cloudwatch_event_target" "lambda_evt_target" {
  count = length(var.cron_notifications)
  rule = aws_cloudwatch_event_rule.lambda_schedule[count.index].name
  arn = aws_lambda_function.lambda.arn
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  count = length(var.queue_event_sources)
  event_source_arn = var.queue_event_sources[count.index].arn
  function_name    = aws_lambda_function.lambda.arn
  batch_size = var.queue_event_sources[count.index].batch_size
}
