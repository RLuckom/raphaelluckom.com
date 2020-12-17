variable "domain_settings" {
  type = object({
    domain_name = string
    domain_name_prefix = string
    allowed_origins = list(string)
    subject_alternative_names = list(string)
  })
}

variable lambda_bucket {
  type = string
}

variable site_description_content {
  type = string
}

variable site_name {
  type = string
}

variable route53_zone_name {
  type = string
}

variable layer_arns {
  type = object({
    donut_days = string
    markdown_tools = string
  })
}

variable debug {
  default = true
}

variable default_cloudfront_ttls {
  type = object({
    min = number
    default = number
    max = number
  })
  default = {
    min = 0
    default = 0
    max = 0
  }
}
