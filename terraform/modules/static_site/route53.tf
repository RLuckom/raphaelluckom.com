data "aws_route53_zone" "selected" {
  name         = var.route53_zone_name
  private_zone = false
}

resource "aws_route53_record" "cert_validation" {
  for_each = {for opt in aws_acm_certificate.cert.domain_validation_options: opt.resource_record_name => opt}
  name = each.value.resource_record_name
  type = each.value.resource_record_type
  zone_id = data.aws_route53_zone.selected.id
  records = [each.value.resource_record_value]
  ttl = 60
}

resource "aws_route53_record" "www_site_cname" {
  zone_id = data.aws_route53_zone.selected.id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = "300"
  records = [aws_cloudfront_distribution.website_distribution.domain_name]
}

resource "aws_route53_record" "site_a_record" {
  zone_id = data.aws_route53_zone.selected.id
  name    = var.domain_name
  type    = "A"

  alias {
    zone_id = aws_cloudfront_distribution.website_distribution.hosted_zone_id
    name                   = aws_cloudfront_distribution.website_distribution.domain_name
    evaluate_target_health = true
  }
}
