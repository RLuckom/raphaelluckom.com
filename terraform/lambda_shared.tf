module "slack_event_relay" {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/permissioned_lambda"
  timeout_secs = 2
  account_id = local.account_id
  region = local.region
  mem_mb = 128
  environment_var_map = {
    SLACK_CREDENTIAL_PARAM = var.slack_credentials_parameterstore_key
    SLACK_CHANNEL = var.app_slack_channel
  }
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/src/slackNotifier.js") 
    },
  ]
  lambda_details = {
    action_name = "slack_event_relay"
    scope_name = "test"
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

module archive_utils {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/archive_utils"
}

module csv_parser {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/csv_parser"
}

module "aws_sdk" {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/aws_sdk"
}

module "donut_days" {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/donut_days"
}


module "image_dependencies" {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/image_dependencies"
}

module "markdown_tools" {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/markdown_tools"
}
