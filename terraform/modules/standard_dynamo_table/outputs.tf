output "table" {
  value = aws_dynamodb_table.standard_table
}

output permission_sets {
  value = {
    put_item = [
        {
          actions   = ["dynamodb:PutItem"]
          resources = [aws_dynamodb_table.standard_table.arn]
        }
      ]
  }
}
