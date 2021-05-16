module human_attention_archive {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/replicated_archive"
  account_id = local.account_id
  region = local.region
  providers = {
    aws.replica1 = aws.frankfurt
    aws.replica2 = aws.sydney
    aws.replica3 = aws.canada
  }
  bucket_prefix = var.bucket_prefix
  security_scope = "prod"
  replication_lambda_event_configs = local.notify_failure_only
  replication_function_logging_config = module.visibility_system.lambda_log_configs["prod"]["human"].config
  donut_days_layer_config = module.donut_days.layer_config
  replication_sources = [{
    bucket = module.admin_interface.website_config.bucket_name
    prefix = "uploads/"
    suffix = ""
    filter_tags = {}
    completion_tags = [{
      Key = "Archived"
      Value = "true"
    }]
    storage_class = "GLACIER"
  }]
}
