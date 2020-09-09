variable "lambda_details" {
  type = object({
    name = string
    bucket = string
    key = string
    policy_statements = list(object({
      actions = list(string)
      resources = list(string)
    }))
    invoking_principal = object({
      service = string
      source_arn = string
    })
  })
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
  default = 14
}

variable "reserved_concurrent_executions" {
  type = number
  default = -1
}

variable "environment_var_map" {
  type = map(string)
  default = {}
}
