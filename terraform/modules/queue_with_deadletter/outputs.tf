

resource "aws_sqs_queue" "dead_letter" {
  name                      = "${var.queue_name}_deadletter"
}

resource "aws_sqs_queue" "queue" {
  name                      = var.queue_name
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dead_letter.arn
    maxReceiveCount     = var.maxReceiveCount
  })
}
