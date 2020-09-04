resource "aws_apigatewayv2_route" "route" {
  api_id    = aws_apigatewayv2_api.example.id
  route_key = var.route_key
}
