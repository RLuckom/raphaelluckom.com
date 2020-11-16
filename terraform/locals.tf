locals {
  media_input_trigger_jpeg =  [
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "JPG"
    },
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "jpeg"
    },
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = "jpg"
    },
    {
      lambda_arn = module.image_archive_lambda.lambda.arn
      lambda_name = module.image_archive_lambda.lambda.function_name
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
  generic_cloudwatch_logs_schema = {
    partition_keys = [
      {
        name = "year"
        type = "string"
      },
      {
        name = "month"
        type = "string"
      },
      {
        name = "day"
        type = "string"
      },
      {
        name = "service"
        type = "string"
      },
      {
        name = "sourcename"
        type = "string"
      }
    ]

    columns = [
      {
        name = "ingesttime"
        type = "string"
      },
      {
        name = "logmessage"
        type = "string"
      }
    ]
  }

  cloudfront_access_log_schema = {
    columns = [
      {
        name = "date"
        type = "date"
      },
      {
        name = "time"
        type = "string"
      },
      {
        name = "location"
        type = "string"
      },
      {
        name = "bytes"
        type = "bigint"
      },
      {
        name = "requestip"
        type = "string"
      },
      {
        name = "method"
        type = "string"
      },
      {
        name = "host"
        type = "string"
      },
      {
        name = "uri"
        type = "string"
      },
      {
        name = "status"
        type = "int"
      },
      {
        name = "referrer"
        type = "string"
      },
      {
        name = "useragent"
        type = "string"
      },
      {
        name = "querystring"
        type = "string"
      },
      {
        name = "cookie"
        type = "string"
      },
      {
        name = "resulttype"
        type = "string"
      },
      {
        name = "requestid"
        type = "string"
      },
      {
        name = "hostheader"
        type = "string"
      },
      {
        name = "requestprotocol"
        type = "string"
      },
      {
        name = "requestbytes"
        type = "bigint"
      },
      {
        name = "timetaken"
        type = "float"
      },
      {
        name = "xforwardedfor"
        type = "string"
      },
      {
        name = "sslprotocol"
        type = "string"
      },
      {
        name = "sslcipher"
        type = "string"
      },
      {
        name = "responseresulttype"
        type = "string"
      },
      {
        name = "httpversion"
        type = "string"
      },
      {
        name = "filestatus"
        type = "string"
      },
      {
        name = "encryptedfields"
        type = "int"
      },
      {
        name = "port"
        type = "int"
      },
      {
        name = "ttfb"
        type = "float"
      },
      {
        name = "detailedresulttype"
        type = "string"
      },
      {
        name = "contenttype"
        type = "string"
      },
      {
        name = "contentlength"
        type = "bigint"
      },
      {
        name = "rangestart"
        type = "bigint"
      },
      {
        name = "rangeend"
        type = "bigint"
      }
    ]
  }
}
