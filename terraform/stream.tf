module "stream_items_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "stream_items"
}

resource "aws_s3_bucket" "stream_input_bucket" {
  bucket = var.stream_input_bucket_name
}

module "processed_for_stream" {
  source = "./modules/queue_with_deadletter"
  queue_name = "processed_for_stream"
  maxReceiveCount = 3
}
