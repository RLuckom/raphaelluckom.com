resource "aws_apigatewayv2_route" "route" {
  authorization_type = "NONE"
  api_id    = var.api_id
  route_key = var.route_key
  target = "integrations/${aws_apigatewayv2_integration.integration.id}"
}

resource "aws_apigatewayv2_integration" "integration" {
  api_id              = var.api_id
  integration_uri    = "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${aws_lambda_function.integration_lambda.arn}/invocations"
  integration_type = "AWS_PROXY"
}

resource "aws_lambda_function" "integration_lambda" {
  function_name = var.lambda_name
  s3_bucket = var.lambda_code_bucket
	s3_key = var.lambda_code_key
  role          = var.lambda_role_arn
  handler       = var.handler
	timeout = var.timeout_secs
	memory_size = var.mem_mb

  runtime = "nodejs12.x"
}

resource "aws_lambda_permission" "allow_caller" {
  statement_id  = "AllowExecution"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.integration_lambda.function_name
  principal     = var.invoking_principal.service
}
