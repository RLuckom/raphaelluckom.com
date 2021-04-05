locals {
  media_input_trigger_jpeg =  [
    {
      lambda_arn =""
      lambda_name = ""
      lambda_role_arn = ""
      permission_type     = "read_and_tag_known"
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "JPG"
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
