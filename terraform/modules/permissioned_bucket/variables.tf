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
