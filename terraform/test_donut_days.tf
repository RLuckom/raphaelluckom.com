module "test" {
  source = "./modules/permissioned_lambda"
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/templates/generic_donut_days/index.js") 
    },
    {
      file_name = "utils.js"
      file_contents = file("./functions/templates/test/utils.js") 
    },
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/templates/test/config.js",
      {
        slack_credentials_parameterstore_key = var.slack_credentials_parameterstore_key
        example_jpg = var.example_jpg
      }
    )
    }
  ]
  lambda_details = {
    action_name = "test"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      local.permission_sets.read_slack_credentials
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
    NODE_DEBUG = "request"
  }
  layers = [aws_lambda_layer_version.donut_days.arn]
}
