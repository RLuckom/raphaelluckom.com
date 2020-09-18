module "stream_items_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "stream_items"
  ttl = [{
    enabled = true
    attribute_name = "stream_entry_time"
  }]
}

resource "aws_s3_bucket" "stream_input_bucket" {
  bucket = var.stream_input_bucket_name
}

module "processed_for_stream" {
  source = "./modules/permissioned_queue"
  queue_name = "processed_for_stream"
  maxReceiveCount = 3
}
