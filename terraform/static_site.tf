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