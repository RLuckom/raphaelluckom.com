output "queue" {
  value = aws_sqs_queue.queue
}

output "deadletter" {
  value = aws_sqs_queue.dead_letter
}
