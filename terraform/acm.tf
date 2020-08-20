resource "aws_acm_certificate" "raphaelluckom_cert" {
  domain_name       = "raphaelluckom.com"
  subject_alternative_names = ["www.raphaelluckom.com"]
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "cert" {
  certificate_arn = "${aws_acm_certificate.raphaelluckom_cert.arn}"
  validation_record_fqdns = ["${aws_route53_record.cert_validation.fqdn}", "${aws_route53_record.cert_validation_www.fqdn}"]
}

