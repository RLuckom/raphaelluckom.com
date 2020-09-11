output "bucket" {
  value = aws_s3_bucket.bucket
}

output "permission_sets" {
  value = {
    athena_query_execution = [{
      actions   =  [
        "s3:GetObject",
        "s3:ListMultipartUploadParts",
        "s3:PutObject",
        "s3:GetBucketLocation",
        "s3:GetBucketAcl",
        "s3:ListBucket"
      ]
      resources = [
        aws_s3_bucket.bucket.arn,
        "${aws_s3_bucket.bucket.arn}/*"
      ]
    }]
    move_objects_out = [{
      actions   =  [
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      resources = [
        aws_s3_bucket.bucket.arn,
        "${aws_s3_bucket.bucket.arn}/*"
      ]
    }]
  }
}
