variable "name_stem" {
  type = string
}

variable "protocol" {
  type = string
}

variable "route_selection_expression" {
  type = string
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
    zone_name = string
  }))
  default = []
}

locals {
  log_format = var.protocol == "WEBSOCKET" ? "[ '$context.requestId' ] [ $context.requestTimeEpoch ] [ $context.identity.sourceIp ] [ $context.connectionId ] [ $context.eventType ] [ $context.status ] [ $context.routeKey ] [ $context.stage ] [ $context.integration.requestId ] [ $context.integration.latency ] [ $context.integration.status ] [ '$context.integration.error' ] [ $context.apiId ] [ $context.connectedAt ] [ $context.domainName ] [ $context.error.messageString ]" : "[ '$context.requestId' ] [ $context.requestTimeEpoch ] [ $context.identity.sourceIp ] [ $context.status ] [ $context.routeKey ] [ $context.stage ] [ $context.integration.requestId ] [ $context.integration.latency ] [ $context.integration.status ] [ '$context.integration.error' ] [ $context.apiId ] [ $context.domainName ] [ $context.error.messageString ]"
}
