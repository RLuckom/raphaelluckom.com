resource "aws_s3_bucket" "raphaelluckom" {
  bucket = "raphaelluckom.com"
  acl    = "public-read"

  website {
    index_document = "index.html"
    error_document = "error.html"
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://raphaelluckom.com"]
    expose_headers  = []
    max_age_seconds = 3000
  }

  tags = {
    Name        = "raphaelluckom.com"
  }
}

resource "aws_s3_bucket" "raphaelluckom_logs" {
  bucket = "logs.raphaelluckom.com"
  acl    = "log-delivery-write"

  tags = {
    Name        = "logs.raphaelluckom.com"
  }
}

resource "aws_s3_bucket" "rluckom_partitioned" {
  bucket = "rluckom.timeseries"

  tags = {
    Name        = "partitioned"
  }
}
