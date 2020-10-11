module "event_configured_lambda" {
  source = "./modules/permissioned_lambda"
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
      file_name = "helpers.js"
      file_contents = file("./functions/templates/event_configured_donut_days/helpers.js")
    },
  ]
  lambda_details = {
    action_name = "event_configuration_test"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      module.media_table.permission_sets.put_item,
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

module "test_ecdd" {
  source = "./modules/permissioned_lambda"
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/templates/generic_donut_days/index.js") 
    },
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/templates/test_ecdd/config.js",
      {
        test_function = module.event_configured_lambda.lambda.function_name
      photo_input_bucket = module.media_input_bucket.bucket.id
      media_storage_bucket = module.photos_media_output_bucket.bucket.id
      media_storage_prefix = "images"
      media_dynamo_table = module.media_table.table.name
      media_hosting_bucket = module.media_hosting_bucket.website_bucket.bucket.id

      }
    )
    }
  ]
  lambda_details = {
    action_name = "test_ecdd"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      module.event_configured_lambda.permission_sets.invoke
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [aws_lambda_layer_version.donut_days.arn]
}
