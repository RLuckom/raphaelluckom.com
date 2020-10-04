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

module "event_log_lambda" {
  source = "./modules/permissioned_lambda"
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/templates/generic_donut_days/index.js") 
    } 
  ]
  lambda_details = {
    action_name = "event_logger"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = [] 
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [aws_lambda_layer_version.donut_days.arn]
}
