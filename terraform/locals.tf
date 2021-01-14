locals {
  media_input_trigger_jpeg =  [
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      lambda_role_arn = module.image_archive_lambda.role.arn
      permission_type     = "read_and_tag_known"
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "JPG"
    },
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      lambda_role_arn = module.image_archive_lambda.role.arn
      permission_type     = "read_and_tag_known"
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "jpeg"
    },
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      lambda_role_arn = module.image_archive_lambda.role.arn
      permission_type     = "read_and_tag_known"
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "jpg"
    },
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      lambda_role_arn = module.image_archive_lambda.role.arn
      permission_type     = "read_and_tag_known"
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "JPEG"
    }
  ]
  permission_sets = {
    read_slack_credentials = [{
      actions = [ "ssm:GetParameter" ]
      resources = [
        "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${var.slack_credentials_parameterstore_key}"
      ]
    }]
    athena_query = [{
      actions   =  [
        "athena:StartQueryExecution",
        "athena:GetQueryResults",
        "athena:GetQueryExecution"
      ]
      resources = [
        "arn:aws:athena:*"
      ]
    }]
    rekognition_image_analysis = [{
      actions = [
        "rekognition:DetectLabels",
        "rekognition:DetectFaces",
        "rekognition:DetectText"
      ]
      resources = ["*"]
    }]
  }
}
