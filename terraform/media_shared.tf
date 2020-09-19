resource "aws_glue_catalog_database" "media_db" {
  name = "rluckom_media"
}

module "media_trigger_lambda" {
  source = "./modules/permissioned_lambda"
  mem_mb = 192
  timeout_secs = 5
  environment_var_map = {
    EXPLORANDA_DEBUG = "true"
    MEDIA_EVENT_TARGETS = templatefile("${path.module}/media_events.tpl", {
      jpg_processor_arn = "${module.photos_lambda.lambda.arn}"
    })
  }
  lambda_details = {
    name = "media_trigger_lambda"
    bucket = aws_s3_bucket.lambda_bucket.id
    key = "media_trigger_lambda/lambda.zip"

    policy_statements = concat(
      module.photos_lambda.permission_sets.invoke
    )
  }
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

  lambda_notifications = [
    {
      lambda_arn = module.media_trigger_lambda.lambda.arn
      lambda_name = module.media_trigger_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "JPG"
    }
  ]
}

module "media_table" {
  source = "./modules/standard_dynamo_table"
  table_name = "media"
}
