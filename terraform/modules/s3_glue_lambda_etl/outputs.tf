output "input_bucket" {
  value = {
    arn = var.input_bucket_arn == "" ? aws_s3_bucket.input_bucket[0].arn : var.input_bucket_arn
    id = var.input_bucket == "" ? aws_s3_bucket.input_bucket[0].id : var.input_bucket
  }
}
output "athena_result_bucket" {
  value = {
    arn = var.athena_result_bucket_arn == "" ? aws_s3_bucket.athena_result_bucket[0].arn : var.athena_result_bucket_arn
    id = var.athena_result_bucket == "" ? aws_s3_bucket.athena_result_bucket[0].id : var.athena_result_bucket
  }
}
output "partition_bucket" {
  value = {
    arn = var.partition_bucket_arn == "" ? aws_s3_bucket.partition_bucket[0].arn : var.partition_bucket_arn
    id = var.partition_bucket == "" ? aws_s3_bucket.partition_bucket[0].id : var.partition_bucket
  }
}
output "metadata_bucket" {
  value = {
    arn = var.metadata_bucket_arn == "" ? aws_s3_bucket.metadata_bucket[0].arn : var.metadata_bucket_arn
    id = var.metadata_bucket == "" ? aws_s3_bucket.metadata_bucket[0].id : var.metadata_bucket
  }
}
