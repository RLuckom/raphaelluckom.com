output "sha" {
  value = sha1(join(",", list(
                jsonencode(aws_apigatewayv2_integration.integration),
                      jsonencode(aws_apigatewayv2_route.route),
                          )))

}
