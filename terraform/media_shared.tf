locals {
  media_input_trigger_jpeg =  [
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "JPG"
    },
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "jpeg"
    },
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "jpg"
    },
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "JPEG"
    }
  ]
}

module "media_input_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
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
  source = "github.com/RLuckom/terraform_modules//aws/standard_dynamo_table"
  table_name = "media"
}

module "labeled_media_table" {
  source = "github.com/RLuckom/terraform_modules//aws/standard_dynamo_table"
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
