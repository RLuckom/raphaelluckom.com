module admin_site_blog_plugin {
  source = "./modules/plugins/blog"
  admin_site_resources = module.admin_interface.site_resources
  account_id = local.account_id
  region = local.region
  name = "blog"
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.prod_site_title
  subject_alternative_names = ["www.test.raphaelluckom.com"]
  logging_config = module.visibility_system.lambda_log_configs["test"]["test"].config
  lambda_event_configs = local.notify_failure_only
  coordinator_data = module.visibility_system.serverless_site_configs["test"]
  plugin_config = module.admin_interface.plugin_config["blog"]
  image_layer = module.image_dependencies.layer_config
  donut_days_layer = module.donut_days.layer_config
  markdown_tools_layer = module.markdown_tools.layer_config
}

module admin_site_prod_blog_plugin {
  source = "./modules/plugins/blog"
  admin_site_resources = module.admin_interface.site_resources
  account_id = local.account_id
  region = local.region
  name = "prod_blog"
  subject_alternative_names = ["www.raphaelluckom.com"]
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.prod_site_title
  logging_config = module.visibility_system.lambda_log_configs["prod"]["human"].config
  lambda_event_configs = local.notify_failure_only
  coordinator_data = module.visibility_system.serverless_site_configs["raphaelluckom_com"]
  plugin_config = module.admin_interface.plugin_config["prod_blog"]
  image_layer = module.image_dependencies.layer_config
  donut_days_layer = module.donut_days.layer_config
  markdown_tools_layer = module.markdown_tools.layer_config
}