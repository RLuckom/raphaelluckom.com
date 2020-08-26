variable "lambda_name_stem" {
  type = string
}

variable "lambda_iam_policy" {
  type = string
}

variable "handler" {
  type = string
  default = "index.handler"
}

variable "lambda_code_bucket" {
  type = string
}

variable "lambda_code_key" {
  type = string
}

variable "lambda_env" {
  type = map
}

variable "timeout_secs" {
  type = number
}

variable "mem_mb" {
  type = number
}

variable "rotation_period_expression" {
  type = string
}

