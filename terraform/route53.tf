data "aws_route53_zone" "selected" {
  name         = "raphaelluckom.com."
  private_zone = false
}

resource "aws_route53_record" "cert_validation" {
  name = "${aws_acm_certificate.raphaelluckom_cert.domain_validation_options.0.resource_record_name}"
  type = "${aws_acm_certificate.raphaelluckom_cert.domain_validation_options.0.resource_record_type}"
  zone_id = "${data.aws_route53_zone.selected.id}"
  records = ["${aws_acm_certificate.raphaelluckom_cert.domain_validation_options.0.resource_record_value}"]
  ttl = 60
}

resource "aws_route53_record" "www_raphaelluckom" {
  zone_id = "${data.aws_route53_zone.selected.id}"
  name    = "www.raphaelluckom.com"
  type    = "CNAME"
  ttl     = "300"
  records = ["${aws_cloudfront_distribution.raphaelluckom_distribution.domain_name}"]
}
