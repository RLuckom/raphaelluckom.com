module "media_input_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_bucket"
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

  lambda_notifications = local.media_input_trigger_jpeg
}

module "media_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "media"
}

module "labeled_media_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "labeled_media"
  partition_key = {
    name = "label"
    type = "S"
  }
  range_key = {
    name = "mediaId"
    type = "S"
  }
}

module "stream_input_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_bucket"
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
