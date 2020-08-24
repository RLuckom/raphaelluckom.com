resource "aws_iam_policy" "log_rotator_access_to_buckets" {
  name = "log-rotation-${var.domain_name_prefix}"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Effect": "Allow",
      "Resource": [
        "${aws_s3_bucket.logging_bucket.arn}",
        "${aws_s3_bucket.logging_bucket.arn}/*"
      ]
    },
    {
      "Action": [
        "s3:PutObject"
      ],
      "Effect": "Allow",
      "Resource": [
        "${aws_s3_bucket.partition_bucket.arn}/*"
      ]
    }
  ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "log_rotation" {
  role       = aws_iam_role.log_rotator_role.name
  policy_arn = aws_iam_policy.log_rotator_access_to_buckets.arn
}

resource "aws_iam_role" "log_rotator_role" {
  name = "${var.domain_name_prefix}-log-rotator"

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

resource "aws_lambda_function" "log_rotator_lambda" {
  filename      = "log-rotator.zip"
  function_name = "log-rotator"
  role          = aws_iam_role.log_rotator_role.arn
  handler       = "index.handler"

  # The filebase64sha256() function is available in Terraform 0.11.12 and later
  # For Terraform 0.11.11 and earlier, use the base64sha256() function and the file() function:
  # source_code_hash = "${base64sha256(file("lambda_function_payload.zip"))}"
  source_code_hash = filebase64sha256("log-rotator.zip")

  runtime = "nodejs12.x"
  timeout = 40

  environment {
    variables = {
      LOG_BUCKET = aws_s3_bucket.logging_bucket.id
      LOG_PREFIX = var.domain_name_prefix
      PARTITION_BUCKET = aws_s3_bucket.partition_bucket.id
      PARTITION_PREFIX = "${var.partition_prefix}/${var.domain_name}"
    }
  }
}

resource "aws_cloudwatch_event_rule" "rotation_period" {
  schedule_expression = var.rotation_period_expression
}

resource "aws_cloudwatch_event_target" "rotation_evt_target" {
  rule = aws_cloudwatch_event_rule.rotation_period.name
  arn = aws_lambda_function.log_rotator_lambda.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_rotator" {
  statement_id = "AllowExecutionFromCloudWatch"
  action = "lambda:InvokeFunction"
  function_name = aws_lambda_function.log_rotator_lambda.arn
  principal = "events.amazonaws.com"
  source_arn = aws_cloudwatch_event_rule.rotation_period.arn
}
