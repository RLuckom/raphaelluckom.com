module "stream_items_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "stream_items"
}

resource "aws_s3_bucket" "post_input_bucket" {
  bucket = var.post_input_bucket_name
}
