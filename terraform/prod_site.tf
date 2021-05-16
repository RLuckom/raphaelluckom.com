module prod_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/tetrapod"
  maintainer = var.maintainer
  account_id = local.account_id
  region = local.region
  nav_links = var.nav_links
  site_title = var.prod_site_title
  coordinator_data = module.visibility_system.serverless_site_configs["raphaelluckom_com"]
  subject_alternative_names = ["www.raphaelluckom.com"]
  trails_table_name = "prod-trails_table"
  lambda_event_configs = local.notify_failure_only
  layers = {
    donut_days = module.donut_days.layer_config
    markdown_tools = module.markdown_tools.layer_config
  }
}
