output "cert_arn" {
  value = aws_acm_certificate_validation.cert_validation.certificate_arn
}

output "logging_bucket_arn" {
  value = aws_s3_bucket.logging_bucket.arn
}

output "logging_bucket_id" {
  value = aws_s3_bucket.logging_bucket.id
}
