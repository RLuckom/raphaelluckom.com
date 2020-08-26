resource "aws_iam_policy" "lambda_policy" {
  name = "lambda-policy-${var.lambda_name_stem}"
  policy = var.lambda_iam_policy

}

resource "aws_iam_role_policy_attachment" "lambda_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_role" "lambda_role" {
  name = "lambda-role-${var.lambda_name_stem}"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
    name              = "/aws/lambda/${aws_lambda_function.lambda.function_name}"
      retention_in_days = 14
    }

resource "aws_lambda_function" "lambda" {
  filename      = var.filename
  function_name = var.lambda_name_stem
  role          = aws_iam_role.lambda_role.arn
  handler       = var.handler

  # The filebase64sha256() function is available in Terraform 0.11.12 and later
  # For Terraform 0.11.11 and earlier, use the base64sha256() function and the file() function:
  # source_code_hash = "${base64sha256(file("lambda_function_payload.zip"))}"
  source_code_hash = filebase64sha256(var.filename)

  runtime = "nodejs12.x"
  timeout = var.timeout_secs
  memory_size = var.mem_mb

  environment {
    variables = var.lambda_env
  }
}

resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  schedule_expression = var.rotation_period_expression
}

resource "aws_cloudwatch_event_target" "lambda_evt_target" {
  rule = aws_cloudwatch_event_rule.lambda_schedule.name
  arn = aws_lambda_function.lambda.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_lambda" {
  statement_id = "AllowExecutionFromCloudWatch"
  action = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.arn
  principal = "events.amazonaws.com"
  source_arn = aws_cloudwatch_event_rule.lambda_schedule.arn
}
