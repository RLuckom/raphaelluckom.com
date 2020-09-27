module "test_donut_days_lambda" {
  source = "./modules/permissioned_lambda"
  lambda_details = {
    action_name = "test_donut_days"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      module.event_logger_lambda.permission_sets.invoke
    )
  }
  self_invoke = {
    allowed = true
    concurrent_executions = 3
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
    DONUT_DAYS_CONFIG = templatefile("./invoke.tpl", {
      function_name: module.event_logger_lambda.lambda.arn
    })
  }
}

module "event_logger_lambda" {
  source = "./modules/permissioned_lambda"
  lambda_details = {
    action_name = "event_logger"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements = []
  }
}
