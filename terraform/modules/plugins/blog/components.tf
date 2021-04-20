module process_image_uploads {
  source = "github.com/RLuckom/terraform_modules//aws/utility_functions/image_upload_processor"
  logging_config = var.logging_config
  lambda_event_configs = var.lambda_event_configs
  security_scope = var.security_scope
  image_layer = var.image_layer
  donut_days_layer = var.donut_days_layer
  io_config = {
    input_bucket = local.plugin_config.private_storage_bucket
    input_path = local.plugin_config.private_storage_image_upload_path
    output_bucket = var.plugin_config.bucket_name
    output_path = local.plugin_config.plugin_image_hosting_path
    tags = []
  }
}
