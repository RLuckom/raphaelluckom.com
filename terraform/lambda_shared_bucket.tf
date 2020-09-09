resource "aws_s3_bucket" "lambda_bucket" {
  bucket = var.lambda_bucket_name

  tags = {
    Name        = "lambda"
  }
}

resource "aws_s3_bucket" "scratch_bucket" {
  bucket = var.scratch_bucket_name

  tags = {
    Name        = "scratch"
  }
}
