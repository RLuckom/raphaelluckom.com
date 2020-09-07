variable "redeploy_sha" {
  type = string
}

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
