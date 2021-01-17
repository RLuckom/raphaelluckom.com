module "photos_media_output_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_bucket"
  bucket = local.media_output_bucket_name
  object_policy_statements = [
    local.media_storage_policy,
  ]
}

locals {
  media_output_bucket_name = "rluckom.photos.partition"
  media_storage_config = {
    bucket = local.media_output_bucket_name
    prefix = ""
    debug = false
  }
  media_storage_policy = {
    prefix = local.media_storage_config.prefix
    actions = ["s3:PutObject"]
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.image_archive_lambda.role.arn,
        ]
      }
    ]
  }
}

module "image_archive_lambda" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  mem_mb = 512
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/libraries/src/entrypoints/event_configured_donut_days.js")
    },
    {
      file_name = "dependencyHelpers.js"
      file_contents = file("./functions/libraries/src/dependencyhelpers/imageDependencyHelpers.js")
    },
    {
      file_name = "utils.js"
      file_contents = file("./functions/libraries/src/utils.js") 
    }, 
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/configs/imagePipelineConfig.js",
      {
      photo_input_bucket = module.media_input_bucket.bucket.id
      media_storage_bucket = module.photos_media_output_bucket.bucket.id
      media_storage_prefix = "images"
      media_dynamo_table = module.media_table.table.name
      labeled_media_dynamo_table = module.labeled_media_table.table.name
      media_hosting_bucket = module.media_bucket.bucket.id
      post_input_bucket_name = module.stream_input_bucket.bucket.id 
      slack_credentials_parameterstore_key = var.slack_credentials_parameterstore_key

      })
    },
  ]
  lambda_event_configs = local.notify_failure_only
  lambda_details = {
    action_name = "image_archive"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      local.permission_sets.read_slack_credentials,
      module.media_table.permission_sets.put_item,
      module.labeled_media_table.permission_sets.put_item,
      local.permission_sets.rekognition_image_analysis,
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [
    module.donut_days.layer.arn,
    module.image_dependencies.layer.arn
  ]
}
