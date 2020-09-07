output "metadata_bucket" {
  value = {
    arn = aws_s3_bucket.metadata_bucket.arn
    id = aws_s3_bucket.metadata_bucket.id
  }
}

output "table" {
  value = aws_glue_catalog_table.table
}
