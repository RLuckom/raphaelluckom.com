output "table" {
  value = {
    arn = aws_dynamodb_table.standard_table.arn
    name = aws_dynamodb_table.standard_table.name
    id = aws_dynamodb_table.standard_table.id
  }
}
