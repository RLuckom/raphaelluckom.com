
resource "aws_s3_bucket" "partition_bucket" {
  bucket = var.partitioned_bucket_name

  tags = {
    Name        = "partitioned"
  }
}

resource "aws_s3_bucket" "athena_bucket" {
  bucket = var.athena_bucket_name

  tags = {
    Name        = "athena"
  }
}
