module admin_site_blog_plugin {
  source = "./modules/plugins/blog"
  default_styles_path = module.admin_interface.default_styles_path
  name = "blog"
  logging_config = module.visibility_system.lambda_log_configs["prod"]["human"].config
  lambda_event_configs = local.notify_failure_only
  security_scope = module.visibility_system.lambda_log_configs["prod"]["human"].security_scope
  image_layer = module.image_dependencies.layer_config
  donut_days_layer = module.donut_days.layer_config
  plugin_config = module.admin_interface.plugin_config
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
      arns = [module.admin_interface.plugin_authenticated_roles["blog"].arn]
    }
  ]
  subject_alternative_names = ["www.test.raphaelluckom.com"]
  lambda_event_configs = local.notify_failure_only
  layers = {
    donut_days = module.donut_days.layer_config
    markdown_tools = module.markdown_tools.layer_config
  }
}
