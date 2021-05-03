module post_entry_lambda {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  config_contents = templatefile("${path.module}/src/backend/post_entry_config.js",
  {
    website_bucket = module.blog_site.website_bucket_name
    original_image_prefix = "${var.plugin_config.hosting_root}img/"
    public_hosting_image_prefix = "img/"
    original_image_hosting_root = "https://${var.plugin_config.domain}/${var.plugin_config.hosting_root}img/"
    blog_image_hosting_root = "/img/"
  })
  logging_config = var.logging_config
  invoking_roles = [
    var.plugin_config.authenticated_role.arn
  ]
  lambda_event_configs = var.lambda_event_configs
  action_name = "post_entry"
  scope_name = var.coordinator_data.system_id.security_scope
  donut_days_layer = var.donut_days_layer
  additional_layers = [var.markdown_tools_layer]
}

module process_image_uploads {
  source = "github.com/RLuckom/terraform_modules//aws/utility_functions/image_upload_processor"
  logging_config = var.logging_config
  lambda_event_configs = var.lambda_event_configs
  security_scope = var.coordinator_data.system_id.security_scope
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

module blog_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/tetrapod"
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.site_title
  coordinator_data = var.coordinator_data
  website_bucket_prefix_object_permissions = [
    {
      permission_type = "put_object"
      prefix = "posts/"
      arns = [module.post_entry_lambda.role.arn]
    },
    {
      permission_type = "put_object"
      prefix = "img/"
      arns = [module.post_entry_lambda.role.arn]
    },
  ]
  website_bucket_bucket_permissions = [
    {
      permission_type = "list_bucket"
      arns = [var.plugin_config.authenticated_role.arn]
    }
  ]
  subject_alternative_names = ["www.test.raphaelluckom.com"]
  lambda_event_configs = var.lambda_event_configs
  layers = {
    donut_days = var.donut_days_layer
    markdown_tools = var.markdown_tools_layer
  }
}
