module admin_interface {
  source = "./modules/derestreet"
  system_id = local.variables.cognito_system_id
  coordinator_data = module.visibility_system.serverless_site_configs["test_admin"]
  user_email = "raph.aelluckom@gmail.com"
  subject_alternative_names = ["www.admin.raphaelluckom.com"]
  aws_sdk_layer = module.aws_sdk.layer_config
  plugin_configs = {
    blog = {
      role_name_stem = "blog"
      slug = "blog"
      policy_statements = []
      additional_connect_sources = ["https://s3.amazonaws.com", "https://admin-raphaelluckom-com.s3.amazonaws.com"]
      plugin_relative_bucket_upload_permissions_needed = [{
        permission_type = "put_object"
        plugin_relative_key = "/img/"
        role_arn = null
      }],
      plugin_relative_bucket_host_permissions_needed = [{
        permission_type = "put_object"
        plugin_relative_key = "/img/"
        role_arn = module.process_image_uploads.lambda_role.arn
      }]
      lambda_notifications = [{
        lambda_arn = module.process_image_uploads.lambda_notification_config.lambda_arn
        lambda_name = module.process_image_uploads.lambda_notification_config.lambda_name
        lambda_role_arn = module.process_image_uploads.lambda_notification_config.lambda_role_arn
        events = module.process_image_uploads.lambda_notification_config.events
        plugin_relative_filter_prefix = "/img/"
        filter_suffix = module.process_image_uploads.lambda_notification_config.filter_suffix
        permission_type = module.process_image_uploads.lambda_notification_config.permission_type
      }]
      file_configs = module.admin_site_blog_plugin.files
    }
    visibility = {
      role_name_stem = "athena"
      slug = "visibility"
      policy_statements = []
      additional_connect_sources = ["https://athena.us-east-1.amazonaws.com", "https://s3.amazonaws.com", "https://admin-raphaelluckom-com.s3.amazonaws.com"]
      plugin_relative_bucket_upload_permissions_needed = []
      plugin_relative_bucket_host_permissions_needed = []
      lambda_notifications = []
      file_configs = module.admin_site_visibility_plugin.files
    }
  }
  archive_system = {
    bucket_permissions_needed = module.human_attention_archive.replication_function_permissions_needed[module.admin_interface.website_bucket_name]
    lambda_notifications = module.human_attention_archive.bucket_notifications[module.admin_interface.website_bucket_name]
  }
}
