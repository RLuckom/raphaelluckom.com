module "log_export_notification_lambda" {
  source = "./modules/cron_triggered_lambda"
  name_stem = "log_export_notification"
  lambda_code_bucket = aws_s3_bucket.lambda_bucket.id
  lambda_code_key = "log_export_notification/lambda.zip"
  environment_var_map = {
    "ATHENA_REGION" = var.athena_region
    "PARTITION_BUCKET" = aws_s3_bucket.partition_bucket.id
    "PARTITION_PREFIX" = var.cloudwatch_partition_prefix
  }
  period_expression = "cron(0 1 * * ? *)"
  lambda_iam_policy = var.cloudwatch_log_read_policy
}
