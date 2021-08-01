module admin_site_blog_plugin {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/serverless_site/plugins/blog"
  name = "blog"
  region = local.region
  account_id = local.account_id
  admin_site_resources = module.admin_interface.site_resources
  coordinator_data = module.visibility_system.serverless_site_configs["test"]
  plugin_config = module.admin_interface.plugin_config["blog"]
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.prod_site_title
  subject_alternative_names = ["www.test.raphaelluckom.com"]
  logging_config = module.visibility_system.lambda_log_configs["test"]["test"].config
  lambda_event_configs = local.notify_failure_only
  image_layer = module.image_dependencies.layer_config
  donut_days_layer = module.donut_days.layer_config
  markdown_tools_layer = module.markdown_tools.layer_config
}

module admin_site_prod_blog_plugin {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/serverless_site/plugins/blog"
  name = "prod_blog"
  region = local.region
  account_id = local.account_id
  coordinator_data = module.visibility_system.serverless_site_configs["raphaelluckom_com"]
  admin_site_resources = module.admin_interface.site_resources
  plugin_config = module.admin_interface.plugin_config["prod_blog"]
  subject_alternative_names = ["www.raphaelluckom.com"]
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.prod_site_title
  logging_config = module.visibility_system.lambda_log_configs["prod"]["human"].config
  lambda_event_configs = local.notify_failure_only
  image_layer = module.image_dependencies.layer_config
  donut_days_layer = module.donut_days.layer_config
  markdown_tools_layer = module.markdown_tools.layer_config
}

module admin_site_prod_social_plugin {
  source = "./modules/microburin"
  name = "social"
  region = local.region
  account_id = local.account_id
  admin_site_resources = module.admin_interface.site_resources
  coordinator_data = module.visibility_system.serverless_site_configs["social"]
  plugin_config = module.admin_interface.plugin_config["social"]
  subject_alternative_names = ["www.social.raphaelluckom.com"]
  logging_config = module.visibility_system.lambda_log_configs["prod"]["prod"].config
  lambda_event_configs = local.notify_failure_only
  image_layer = module.image_dependencies.layer_config
  donut_days_layer = module.donut_days.layer_config
  archive_utils_layer = module.archive_utils.layer_config
  markdown_tools_layer = module.markdown_tools.layer_config
}
