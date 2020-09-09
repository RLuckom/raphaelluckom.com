variable "route_key" {
  type = string
}

variable "api_id" {
  type = string
}

variable "lambda_role_arn" {
  type = string
}

variable "timeout_secs" {
  type = number
}

variable "mem_mb" {
  type = number
}

variable "handler" {
  type = string
  default = "index.handler"
}

variable "invoking_principal" {
  type = object({
    service = string
    arn = string
    })
}

variable "lambda_code_bucket" {
  type = string
}

variable "lambda_name" {
  type = string
}

variable "lambda_code_key" {
  type = string
}
