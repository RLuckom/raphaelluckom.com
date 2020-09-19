variable "lambda_details" {
  type = object({
    name = string
    bucket = string
    key = string
    policy_statements = list(object({
      actions = list(string)
      resources = list(string)
    }))
  })
}

variable "invoking_principals" {
  type = list(object({
    service = string
    source_arn = string
  }))
  default = []
}

variable "bucket_notifications" {
  type = list(object({
    bucket = string
    events = list(string)
    filter_prefix = string
    filter_suffix = string
  }))
  default = []
}

variable "cron_notifications" {
  type = list(object({
    period_expression = string
  }))
  default = []
}

variable "queue_event_sources" {
  type = list(object({
    arn = string
    batch_size = number
  }))
  default = []
}

variable "deny_cloudwatch" {
  type = bool
  default = false
}

variable "log_writer_policy" {
  type = list(object({
    actions = list(string)
    resources = list(string)
  }))
  default = [{
    actions   =  [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "arn:aws:logs:*:*:*",
    ]
  }]
}

variable "handler" {
  type = string
  default = "index.handler"
}

variable "timeout_secs" {
  type = number
  default = 10
}

variable "mem_mb" {
  type = number
  default = 256
}

variable "log_retention_period" {
  type = number
  default = 7
}

variable "reserved_concurrent_executions" {
  type = number
  default = -1
}

variable "environment_var_map" {
  type = map(string)
  default = {}
}