locals {
  s3_origin_id = "raphaelluckom"
}

resource "aws_cloudfront_origin_access_identity" "raphaelluckom_access_identity" {
  comment = "access identity for cloudfront to raphaelluckom bucket"
}

resource "aws_cloudfront_distribution" "raphaelluckom_distribution" {
  origin {
    domain_name = "${aws_s3_bucket.raphaelluckom.bucket_regional_domain_name}"
    origin_id   = "${local.s3_origin_id}"

    s3_origin_config {
      origin_access_identity = "origin-access-identity/cloudfront/${aws_cloudfront_origin_access_identity.raphaelluckom_access_identity.id}"
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  logging_config {
    include_cookies = false
    bucket          = "${aws_s3_bucket.raphaelluckom_logs.id}.s3.amazonaws.com"
    prefix          = "raphaelluckom"
  }

  aliases = ["raphaelluckom.com", "www.raphaelluckom.com"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${local.s3_origin_id}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    viewer_protocol_policy = "redirect-to-https"
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = "${aws_acm_certificate_validation.cert.certificate_arn}"
    minimum_protocol_version = "TLSv1"
    ssl_support_method = "sni-only"
  }
}
