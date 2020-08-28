variable "name_stem" {
  type = string
}

variable "handler" {
  type = string
  default = "index.handler"
}

variable "lambda_code_bucket" {
  type = string
}

variable "time_series_table_name" {
  type = string
  default = ""
}

variable "lambda_code_key" {
  type = string
}

variable "timeout_secs" {
  type = number
}

variable "mem_mb" {
  type = number
}

variable "partition_prefix" {
  type = string
  default = ""
}

variable "athena_result_bucket" {
  type = string
}

variable "athena_region" {
  type = string
}

variable "input_bucket" {
  type = string
  default = ""
}

variable "input_prefix" {
  type = string
  default = ""
}

variable "input_suffix" {
  type = string
  default = ""
}

variable "input_bucket_arn" {
  type = string
  default = ""
}

variable "partition_bucket_arn" {
  type = string
  default = ""
}

variable "athena_result_bucket_arn" {
  type = string
  default = ""
}

variable "partition_bucket" {
  type = string
  default = ""
}

variable "time_series_db_name" {
  type = string
  default = ""
}

variable "skip_header_line_count" {
  type = number
  default = 0
}

variable "ser_de_info" {
  type = object({
    name = string
    serialization_library = string
    parameters = map(string)
  })
}

variable "columns" {
  type = list(object({
    name = string
    type = string
  }))
}

variable "partition_keys" {
  type = list(object({
    name = string
    type = string
  }))
  default = [

  {
    name = "year"
    type = "string"
  },

  {
    name = "month"
    type = "string"
  },

  {
    name = "day"
    type = "string"
  },

  {
    name = "hour"
    type = "string"
  }
  ]
}
