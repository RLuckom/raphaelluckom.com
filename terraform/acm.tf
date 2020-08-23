resource "aws_acm_certificate" "raphaelluckom_cert" {
  domain_name       = var.domain_name
  subject_alternative_names = ["www.raphaelluckom.com"]
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "cert" {
  certificate_arn = aws_acm_certificate.raphaelluckom_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation: record.fqdn]
}

