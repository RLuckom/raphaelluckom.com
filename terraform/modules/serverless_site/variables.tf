variable "domain_settings" {
  type = object({
    domain_name = string
    domain_name_prefix = string
    allowed_origins = list(string)
    subject_alternative_names = list(string)
  })
}

variable log_sink {
  type = list(object({
    filter_prefix = string
    filter_suffix = string
    lambda_arn = string
    lambda_name = string
  }))
  default = []
}

variable lambda_event_configs {
  type = list(object({
    maximum_event_age_in_seconds = number
    maximum_retry_attempts = number
    on_success = list(object({
      function_arn = string
    }))
    on_failure = list(object({
      function_arn = string
    }))
  }))
  default = []
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

variable logging_bucket {
  type = string
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
