variable "name_stem" {
  type = string
}

variable "route_selection_expression" {
  type = string
  default = "$request.method $request.path"
}

variable "apigateway_stage_name" {
  type = string
  default = "prod"
}
