module "dd-stub" {
  count = 1
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  config_contents = "module.exports = {"
  lambda_event_configs = local.notify_failure_only
  action_name = "dd-stub"
  scope_name = "test"
  log_bucket = module.lambda_logging_bucket.bucket.id
  source_bucket = aws_s3_bucket.lambda_bucket.id
}
