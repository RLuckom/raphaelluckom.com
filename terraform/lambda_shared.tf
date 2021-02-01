resource "aws_s3_bucket" "lambda_bucket" {
  bucket = var.lambda_bucket_name

  tags = {
    Name        = "lambda"
  }
}

module "slack_event_relay" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  timeout_secs = 2
  mem_mb = 128
  environment_var_map = {
    SLACK_CREDENTIAL_PARAM = var.slack_credentials_parameterstore_key
    SLACK_CHANNEL = var.app_slack_channel
  }
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("${path.root}/functions/libraries/src/entrypoints/send_event_to_slack.js") 
    },
  ]
  lambda_details = {
    action_name = "slack_event_relay"
    scope_name = "test"
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements = concat(
      local.permission_sets.read_slack_credentials
    )
  }
  layers = [module.donut_days.layer_config]
}

locals {
  notify_failure_and_success = [
    {
      maximum_event_age_in_seconds = 60
      maximum_retry_attempts = 2
      on_success = [{
        function_arn = module.slack_event_relay.lambda.arn
      }]
      on_failure = [{
        function_arn = module.slack_event_relay.lambda.arn
      }]
    }
  ]
  notify_failure_only = [
    {
      maximum_event_age_in_seconds = 60
      maximum_retry_attempts = 2
      on_success = []
      on_failure = [{
        function_arn = module.slack_event_relay.lambda.arn
      }]
    }
  ]
  notify_success_only = [
    {
      maximum_event_age_in_seconds = 60
      maximum_retry_attempts = 2
      on_success = []
      on_failure = [{
        function_arn = module.slack_event_relay.lambda.arn
      }]
    }
  ]
}

module "donut_days" {
  source = "github.com/RLuckom/terraform_modules//aws/layers/donut_days"
}

module "image_dependencies" {
  source = "github.com/RLuckom/terraform_modules//aws/layers/image_dependencies"
}

module "markdown_tools" {
  source = "github.com/RLuckom/terraform_modules//aws/layers/markdown_tools"
}

module "nlp" {
  source = "github.com/RLuckom/terraform_modules//aws/layers/nlp"
}
