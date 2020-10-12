
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
        test_function = module.image_archive_lambda.lambda.function_name
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
      module.image_archive_lambda.permission_sets.invoke
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [aws_lambda_layer_version.donut_days.arn]
}
