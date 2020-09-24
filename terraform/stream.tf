module "stream_items_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "stream_items"
  ttl = [{
    enabled = true
    attribute_name = "stream_entry_time"
  }]
}

module "processed_for_stream" {
  source = "./modules/permissioned_queue"
  queue_name = "processed_for_stream"
  maxReceiveCount = 3
}

module "stream_input_bucket" {
  source = "./modules/permissioned_bucket"
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
