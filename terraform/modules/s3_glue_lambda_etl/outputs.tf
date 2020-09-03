output "input_bucket" {
  value = {
    arn = aws_s3_bucket.input_bucket.arn
    id = aws_s3_bucket.input_bucket.id
  }
}
output "athena_result_bucket" {
  value = {
    arn = aws_s3_bucket.athena_result_bucket.arn
    id = aws_s3_bucket.athena_result_bucket.id
  }
}
output "partition_bucket" {
  value = {
    arn = aws_s3_bucket.partition_bucket.arn
    id = aws_s3_bucket.partition_bucket.id
  }
}
output "metadata_bucket" {
  value = {
    arn = aws_s3_bucket.metadata_bucket.arn
    id = aws_s3_bucket.metadata_bucket.id
  }
}
