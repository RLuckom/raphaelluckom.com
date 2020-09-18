resource "aws_glue_catalog_database" "media_db" {
  name = "rluckom_media"
}

module "media_input_bucket" {
  source = "./modules/permissioned_bucket"
  bucket = "rluckom-media-input"
  lifecycle_rules = [{
    id = "expire-processed"
    prefix = ""
    tags = {
      processed = "true"
    }
    enabled = true
    expiration_days = 3
  }]
}

module "media_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "media"
}
