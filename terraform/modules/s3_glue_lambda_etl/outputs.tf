output "input_bucket" {
  value = aws_s3_bucket.input_bucket
}
output "athena_result_bucket" {
  value = aws_s3_bucket.athena_result_bucket
}
output "partition_bucket" {
  value = aws_s3_bucket.partition_bucket
}
output "metadata_bucket" {
  value = module.cloudformation_logs_glue_table.metadata_bucket.id
}
