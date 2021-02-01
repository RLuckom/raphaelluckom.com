module test_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/tetrapod"
  enable = true
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.test_site_title
  #asset_path = "${path.root}/sites/test.raphaelluckom.com/assets"
  routing = {
    scope = "test"
    domain_parts = module.visibility_data_coordinator.serverless_site_configs["test"].domain_parts
    route53_zone_name = var.route53_zone_name
  }
  site_bucket = "test.raphaelluckom.com"
  coordinator_data = module.visibility_data_coordinator.serverless_site_configs["test"]
  subject_alternative_names = ["www.test.raphaelluckom.com"]
  #lambda_bucket = aws_s3_bucket.lambda_bucket.id
  trails_table_name = "test-trails_table"
  #lambda_event_configs = local.notify_failure_only
  #layer_arns = {
  #  donut_days = module.donut_days.layer.arn,
  #  markdown_tools = module.markdown_tools.layer.arn,
  #}
}
