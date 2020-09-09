module "permissioned_lambda" {
  source = "../permissioned_lambda"
  timeout_secs = var.timeout_secs
  mem_mb = var.mem_mb
  environment_var_map = var.environment_var_map
  lambda_details = {
    name = "${var.name_stem}-lambda"
    bucket = var.lambda_code_bucket
    key = var.lambda_code_key
    policy_statements = var.lambda_iam_policy
    invoking_principal = {
      service = "events.amazonaws.com"
      source_arn = aws_cloudwatch_event_rule.lambda_schedule.arn
    }
  }
}

resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  schedule_expression = var.period_expression
}

resource "aws_cloudwatch_event_target" "lambda_evt_target" {
  rule = aws_cloudwatch_event_rule.lambda_schedule.name
  arn = module.permissioned_lambda.lambda.arn
}
