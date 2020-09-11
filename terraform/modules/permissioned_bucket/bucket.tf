resource "aws_s3_bucket" "bucket" {
  bucket = var.bucket
  dynamic "website" {
    for_each = var.website_configs
    content {
      index_document = website.value.index_document
      error_document = website.value.error_document
    }
  }

  dynamic "cors_rule" {
    for_each = var.cors_rules
    content {
      allowed_headers = cors_rule.value.allowed_headers
      allowed_origins = cors_rule.value.allowed_origins
      allowed_methods = cors_rule.value.allowed_methods
      expose_headers = cors_rule.value.expose_headers
      max_age_seconds = cors_rule.value.max_age_seconds
    }
  }
}
