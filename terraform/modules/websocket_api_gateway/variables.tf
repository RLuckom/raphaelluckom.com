variable "name_stem" {
  type = string
}

variable "route_selection_expression" {
  type = string
  default = "$request.body.action"
}

variable "apigateway_stage_name" {
  type = string
  default = "prod"
}

variable "log_retention_period" {
  type = number
  default = 7
}

variable "lambda_routes" {
  type = list(object({
    route_key = string
    handler_arn = string
    handler_name = string
  }))
  default = []
}

variable domain_record {
  type = list(object({
    domain_name = string
    cert_arn = string
    zone_name = string
  }))
  default = []
}
