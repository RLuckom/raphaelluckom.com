module "static_site" {
  source = "./modules/static_site"

  route53_zone_name = var.route53_zone_name
  domain_name = var.domain_name
  domain_name_prefix = var.domain_name_prefix
  subject_alternative_names = var.subject_alternative_names
}
