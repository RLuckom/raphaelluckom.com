resource "aws_s3_bucket" "website_bucket" {
  bucket = var.domain_name
  acl    = "public-read"

  website {
    index_document = "index.html"
    error_document = "error.html"
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://${var.domain_name}"]
    expose_headers  = []
    max_age_seconds = 3000
  }

  tags = {
    Name        = var.domain_name
  }
}

resource "aws_s3_bucket" "logging_bucket" {
  bucket = "logs.${var.domain_name}"
  acl    = "log-delivery-write"

  tags = {
    Name        = "logs.${var.domain_name}"
  }
}

resource "aws_s3_bucket" "partition_bucket" {
  bucket = var.partitioned_bucket_name

  tags = {
    Name        = "partitioned"
  }
}
