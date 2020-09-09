variable "name_stem" {
  type = string
}

variable "lambda_code_bucket" {
  type = string
}

variable "lambda_iam_policy" {
  type = list(object({
    actions = list(string)
    resources = list(string)
  }))
  default = []
}

variable "lambda_code_key" {
  type = string
}

variable "environment_var_map" {
  type = map(string)
}

variable "timeout_secs" {
  type = number
  default = 40
}

variable "mem_mb" {
  type = number
  default = 256
}

variable "period_expression" {
  type = string
}

