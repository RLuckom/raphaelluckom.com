module admin_interface {
  source = "./modules/derestreet"
  system_id = module.visibility_system.serverless_site_configs["test_admin"].system_id
  coordinator_data = module.visibility_system.serverless_site_configs["test_admin"]
  user_email = "raph.aelluckom@gmail.com"
  subject_alternative_names = ["www.admin.raphaelluckom.com"]
  aws_sdk_layer = module.aws_sdk.layer_config
  plugin_static_configs = {
    blog = module.admin_site_blog_plugin.static_config
    visibility = {
      role_name_stem = "athena"
      slug = "visibility"
    }
  }
  plugin_configs = {
    blog = {
      additional_connect_sources = ["https://s3.amazonaws.com", "https://admin-raphaelluckom-com.s3.amazonaws.com"]
      policy_statements = []
      plugin_relative_bucket_upload_permissions_needed = module.admin_site_blog_plugin.plugin_relative_bucket_upload_permissions_needed
      plugin_relative_bucket_host_permissions_needed = module.admin_site_blog_plugin.plugin_relative_bucket_host_permissions_needed 
      lambda_notifications = module.admin_site_blog_plugin.plugin_relative_lambda_notifications
      file_configs = module.admin_site_blog_plugin.files
    }
    visibility = {
      policy_statements = []
      additional_connect_sources = ["https://athena.us-east-1.amazonaws.com", "https://s3.amazonaws.com", "https://admin-raphaelluckom-com.s3.amazonaws.com"]
      plugin_relative_bucket_upload_permissions_needed = []
      plugin_relative_bucket_host_permissions_needed = []
      lambda_notifications = []
      file_configs = module.admin_site_visibility_plugin.files
    }
  }
  archive_system = {
    bucket_permissions_needed = module.human_attention_archive.replication_function_permissions_needed[module.admin_interface.website_config.bucket_name]
    lambda_notifications = module.human_attention_archive.bucket_notifications[module.admin_interface.website_config.bucket_name]
  }
}
