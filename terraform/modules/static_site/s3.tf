module "website_bucket" {
  source = "../permissioned_bucket"
  bucket = var.domain_name
  acl    = "public-read"

  website_configs = [{
    index_document = "index.html"
    error_document = "error.html"
  }]

  cors_rules =[{
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = var.allowed_origins == [] ? ["https://${var.domain_name}"] : var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }]
}

module "logging_bucket" {
  source = "../permissioned_bucket"
  bucket = "logs.${var.domain_name}"
  acl    = "log-delivery-write"
}
