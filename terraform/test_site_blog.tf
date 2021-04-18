module admin_site_blog_plugin {
  source = "./modules/plugins/blog"
  default_styles_path = module.admin_site_frontpage.default_styles_path
}

module test_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/tetrapod"
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.prod_site_title
  coordinator_data = module.visibility_system.serverless_site_configs["test"]
  website_bucket_bucket_permissions = [
    {
      permission_type = "list_bucket"
      arns = [module.cognito_identity_management.authenticated_role["blog"].arn]
    }
  ]
  subject_alternative_names = ["www.test.raphaelluckom.com"]
  lambda_event_configs = local.notify_failure_only
  layers = {
    donut_days = module.donut_days.layer_config
    markdown_tools = module.markdown_tools.layer_config
  }
}

module process_image_uploads {
  source = "github.com/RLuckom/terraform_modules//aws/utility_functions/image_upload_processor?ref=image-proc"
  logging_config = module.visibility_system.lambda_log_configs["prod"]["human"].config
  lambda_event_configs = local.notify_failure_only
  security_scope = module.visibility_system.lambda_log_configs["prod"]["human"].security_scope
  image_layer = module.image_dependencies.layer_config
  io_config = {
    input_bucket = module.admin_site.website_bucket_name
    input_path = "uploads/img/"
    output_bucket = module.admin_site.website_bucket_name
    output_path = "img/"
    tags = []
  }
}
