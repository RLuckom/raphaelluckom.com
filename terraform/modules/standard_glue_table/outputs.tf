output "metadata_bucket" {
  value = {
    arn = length(aws_s3_bucket.metadata_bucket) == 1 ? aws_s3_bucket.metadata_bucket[0].arn : var.external_storage_bucket_arn
    id = length(aws_s3_bucket.metadata_bucket) == 1 ? aws_s3_bucket.metadata_bucket[0].id : var.external_storage_bucket_id
  }
}

output "table" {
  value = aws_glue_catalog_table.table
}
