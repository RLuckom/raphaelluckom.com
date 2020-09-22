module "static_site" {
  source = "./modules/static_site"
  route53_zone_name = var.route53_zone_name
  domain_name = var.domain_name
  allowed_origins = ["https://${var.domain_name}", "http://localhost*"]
  domain_name_prefix = var.domain_name_prefix
  subject_alternative_names = var.subject_alternative_names
}

module "media_hosting_bucket" {
  source = "./modules/static_site"
  route53_zone_name = var.route53_zone_name
  domain_name = var.media_domain_settings.domain_name
  allowed_origins = var.media_domain_settings.allowed_origins
  domain_name_prefix = var.media_domain_settings.domain_name_prefix
  subject_alternative_names = var.media_domain_settings.subject_alternative_names
}

module "test_site" {
  source = "./modules/static_site"
  route53_zone_name = var.route53_zone_name
  domain_name = var.test_domain_settings.domain_name
  allowed_origins = var.test_domain_settings.allowed_origins
  domain_name_prefix = var.test_domain_settings.domain_name_prefix
  subject_alternative_names = var.test_domain_settings.subject_alternative_names
  default_cloudfront_ttls = {
    min = 0
    default = 0
    max = 0
  }
}
