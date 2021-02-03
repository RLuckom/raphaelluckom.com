module prod_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/tetrapod"
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.prod_site_title
  site_bucket = "raphaelluckom.com"
  coordinator_data = module.visibility_system.serverless_site_configs["prod"]
  system_id = {
    security_scope = "prod"
    subsystem_name = "prod"
  }
  routing = {
    domain_parts = module.visibility_system.serverless_site_configs["prod"].domain_parts
    route53_zone_name = var.route53_zone_name
  }
  subject_alternative_names = ["www.raphaelluckom.com"]
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  trails_table_name = "prod-trails_table"
  lambda_event_configs = local.notify_failure_only
  layers = {
    donut_days = module.donut_days.layer_config
    markdown_tools = module.markdown_tools.layer_config
  }
}
