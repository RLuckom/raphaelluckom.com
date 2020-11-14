module "stream_items_table" {
  source = "github.com/RLuckom/terraform_modules//aws/standard_dynamo_table"
  table_name = "stream_items"
  ttl = [{
    enabled = true
    attribute_name = "stream_entry_time"
  }]
}

module "stream_input_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
  bucket = var.stream_input_bucket_name
  lifecycle_rules = [{
    id = "expire-processed"
    prefix = ""
    tags = {
      processed = "true"
      posted = "true"
    }
    enabled = true
    expiration_days = 3
  }]
  lambda_notifications = local.media_input_trigger_jpeg
}
