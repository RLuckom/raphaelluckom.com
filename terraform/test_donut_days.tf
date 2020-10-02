module "test_donut_days_lambda" {
  source = "./modules/permissioned_lambda"
  lambda_details = {
    action_name = "test_donut_days"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = []
  }
  self_invoke = {
    allowed = true
    concurrent_executions = 3
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
    DONUT_DAYS_CONFIG = templatefile("./invoke.tpl", {
    })
  }
}

