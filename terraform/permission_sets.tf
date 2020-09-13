locals {
  permission_sets = {
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
