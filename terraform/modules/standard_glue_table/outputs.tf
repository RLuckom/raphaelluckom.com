data "aws_caller_identity" "current" {}

output "metadata_bucket" {
  value = {
    arn = length(aws_s3_bucket.metadata_bucket) == 1 ? aws_s3_bucket.metadata_bucket[0].arn : var.external_storage_bucket_arn
    id = length(aws_s3_bucket.metadata_bucket) == 1 ? aws_s3_bucket.metadata_bucket[0].id : var.external_storage_bucket_id
  }
}

output "table" {
  value = aws_glue_catalog_table.table
}

output "permission_sets" {
  value = {
    create_partition_glue_permissions = [{
      actions   =  [
        "glue:CreatePartition",
        "glue:GetTable",
        "glue:GetDatabase",
        "glue:BatchCreatePartition"
      ]
      resources = [
        var.db.arn,
        aws_glue_catalog_table.table.arn,
        "arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog",
        "arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog*"
      ]
    }]
  }
}
