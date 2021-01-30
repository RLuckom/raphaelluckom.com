module prod_site_plumbing {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site_plumbing"
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.prod_site_title
  site_bucket = "raphaelluckom.com"
  coordinator_data = module.visibility_data_coordinator.serverless_site_configs["prod"]
  subject_alternative_names = ["www.raphaelluckom.com"]
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  trails_table_name = "prod-trails_table"
  lambda_event_configs = local.notify_failure_only
  route53_zone_name = var.route53_zone_name
  layer_arns = {
    donut_days = module.donut_days.layer.arn,
    markdown_tools =module.markdown_tools.layer.arn,
  }
}
