locals {
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
    cloudwatch_log_read = [{
      actions   =  [
        "logs:DescribeLogGroups"
      ]
      resources = [
        "arn:aws:logs:*"
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
    create_log_exports = [{
      actions = ["logs:DescribeExportTasks", "logs:CreateExportTask"]
      resources = ["*"]
    }]
  }
}
