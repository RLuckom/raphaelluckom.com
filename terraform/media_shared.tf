module "event_trigger_lambda" {
  source = "./modules/permissioned_lambda"
  mem_mb = 192
  timeout_secs = 5
  environment_var_map = {
    EXPLORANDA_DEBUG = "true"
    MEDIA_EVENT_TARGETS = templatefile("${path.module}/media_events.tpl", {
      jpg_processor_arn = module.archive_image_jpg_lambda.lambda.arn
      jpg_resizer_arn = module.jpg_resize_lambda.lambda.arn
      post_input_bucket_name = module.stream_input_bucket.bucket.id 
      public_media_bucket_name = module.media_hosting_bucket.website_bucket.bucket.id 
    })
  }
  lambda_details = {
    action_name = "event_trigger"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      module.archive_image_jpg_lambda.permission_sets.invoke,
      module.jpg_resize_lambda.permission_sets.invoke
    )
  }
}

locals {
  media_input_trigger_jpeg =  [
    {
      lambda_arn = module.event_trigger_lambda.lambda.arn
      lambda_name = module.event_trigger_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "JPG"
    },
    {
      lambda_arn = module.event_trigger_lambda.lambda.arn
      lambda_name = module.event_trigger_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "jpeg"
    },
    {
      lambda_arn = module.event_trigger_lambda.lambda.arn
      lambda_name = module.event_trigger_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "jpg"
    },
    {
      lambda_arn = module.event_trigger_lambda.lambda.arn
      lambda_name = module.event_trigger_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "JPEG"
    }
  ]
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

  lambda_notifications = local.media_input_trigger_jpeg
}

module "media_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "media"
}
