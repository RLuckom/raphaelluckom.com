variable name_stem {
  type = string
}

variable athena_results {
  type = object({
    bucket = string
    path = string
  })
}

variable partitioned_data_sink {
  type = object({
    bucket = string
    prefix = string
  })
}

variable lambda_source_bucket {
  type = string
}

variable ser_de_info {
  type = object({
    name = string
    serialization_library = string
    parameters = map(string)
  })
}

variable columns {
  type = list(object({
    name = string
    type = string
  }))
}

variable glue_database {
  type = string
  default = ""
}

variable lambda_log_bucket {
  type = string
  default = ""
}

variable athena_region {
  default = "us-east-1"
}

variable donut_days_layer_arn {
  default = null
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
