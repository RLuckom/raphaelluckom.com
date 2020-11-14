module "photos_media_output_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
  bucket = "rluckom.photos.partition"
}

locals {
  photo_etl_bucket_notifications = [{
    bucket = module.media_input_bucket.bucket.id
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ""
  }]
}

module "image_archive_lambda" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  mem_mb = 512
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/templates/event_configured_donut_days/index.js")
    },
    {
      file_name = "dependencyHelpers.js"
      file_contents = file("./functions/templates/event_configured_donut_days/imageDependencyHelpers.js")
    },
    {
      file_name = "utils.js"
      file_contents = file("./functions/templates/test/utils.js") 
    }, 
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/templates/pipelines/imagePipelineConfig.js",
      {
      photo_input_bucket = module.media_input_bucket.bucket.id
      media_storage_bucket = module.photos_media_output_bucket.bucket.id
      media_storage_prefix = "images"
      media_dynamo_table = module.media_table.table.name
      labeled_media_dynamo_table = module.labeled_media_table.table.name
      media_hosting_bucket = module.media_hosting_bucket.website_bucket.bucket.id
      post_input_bucket_name = module.stream_input_bucket.bucket.id 
      slack_credentials_parameterstore_key = var.slack_credentials_parameterstore_key

      })
    },
    {
      file_name = "helpers.js"
      file_contents = file("./functions/templates/event_configured_donut_days/helpers.js")
    },
  ]
  lambda_details = {
    action_name = "image_archive"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      local.permission_sets.read_slack_credentials,
      module.media_table.permission_sets.put_item,
      module.labeled_media_table.permission_sets.put_item,
      local.permission_sets.rekognition_image_analysis,
      module.media_input_bucket.permission_sets.read_and_tag,
      module.stream_input_bucket.permission_sets.read_and_tag,
      module.stream_input_bucket.permission_sets.read_and_tag,
      module.media_hosting_bucket.website_bucket.permission_sets.put_object,
      module.photos_media_output_bucket.permission_sets.put_object,
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [
    aws_lambda_layer_version.donut_days.arn,
    aws_lambda_layer_version.image_dependencies.arn
  ]
}
