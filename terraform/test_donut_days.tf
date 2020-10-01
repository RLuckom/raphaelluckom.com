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

resource "aws_lambda_layer_version" "donut_days" {
  layer_name = "donut_days"
  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key = "layers/donut_days/layer.zip"
  compatible_runtimes = ["nodejs12.x"]
}

module "log_export_lambda" {
  source = "./modules/permissioned_lambda"
  source_contents = [
    {
      file_contents = templatefile("./functions/templates/log_exports/config.js", {
        log_export_destination_bucket = module.logs_partition_bucket.bucket.id
        partition_prefix = var.cloudwatch_partition_prefix
        athena_db = aws_glue_catalog_database.time_series_database.name
        athena_table = var.cloudwatch_logs_table_name
        athena_result_bucket = "s3://${module.logs_athena_bucket.bucket.id}/"
      })
      file_name = "config.js"
    },
    {
      file_name = "index.js"
      file_contents = file("./functions/templates/log_exports/index.js") 
    } 
  ]
  lambda_details = {
    action_name = "log_export"
    scope_name = "cloudwatch"
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat( 
      local.permission_sets.cloudwatch_log_read 
    )
  }
  self_invoke = {
    allowed = true
    concurrent_executions = 3
  }
  layers = [aws_lambda_layer_version.donut_days.arn]
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
}
