locals {
  permission_sets = {
    read_slack_credentials = [{
      actions = [ "ssm:GetParameter" ]
      resources = [
        "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${var.slack_credentials_parameterstore_key}"
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
