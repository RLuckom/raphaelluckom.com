variable "bucket" {
  type = string
}

variable "website_configs" {
  type = list(object({
    index_document = string
    error_document = string
  }))
  default = []
}

variable "acl" {
  type = string
  default = "private"
}

variable cors_rules {
  type = list(object({
    allowed_headers = list(string)
    allowed_methods = list(string)
    allowed_origins = list(string)
    expose_headers = list(string)
    max_age_seconds = number
  }))
  default = []
}

variable lifecycle_rules {
  type = list(object({
    id = string
    prefix = string
    tags = map(string)
    enabled = bool
    expiration_days = number
  }))
  default = []
}

variable "lambda_notifications" {
  type = list(object({
    lambda_arn = string
    lambda_name = string
    events = list(string)
    filter_prefix = string
    filter_suffix = string
  }))
  default = []
}