module "media_hosting_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/cloudfront_s3_website"
  route53_zone_name = var.route53_zone_name
  domain_name = var.media_domain_settings.domain_name
  allowed_origins = var.media_domain_settings.allowed_origins
  domain_name_prefix = var.media_domain_settings.domain_name_prefix
  subject_alternative_names = var.media_domain_settings.subject_alternative_names
}

module "test_site" {
  source = "./modules/extracted_serverless_site"
  domain_settings = var.test_domain_settings
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  site_description_content = file("./sites/test.raphaelluckom.com/site_description.json")
  site_name = "test"
  debug = false
  route53_zone_name = var.route53_zone_name
  layer_arns = {
    donut_days = aws_lambda_layer_version.donut_days.arn,
    markdown_tools =aws_lambda_layer_version.markdown_tools.arn,
  }
}

module "prod_site" {
  source = "./modules/serverless_site"
  domain_settings = var.prod_domain_settings
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  site_description_content = file("./sites/raphaelluckom.com/site_description.json")
  site_name = "prod"
  debug = false
  route53_zone_name = var.route53_zone_name
  layer_arns = {
    donut_days = aws_lambda_layer_version.donut_days.arn,
    markdown_tools =aws_lambda_layer_version.markdown_tools.arn,
  }
}
