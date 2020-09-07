variable "name_stem" {
  type = string
}

variable "db" {
  type = object({
    name = string
    arn = string
  })
}

  variable "metadata_partition_prefix" {
    type = string
  default = ""
}

variable "lambda_code_bucket" {
  type = string
}

variable "lambda_code_key" {
  type = string
}

variable "partition_prefix" {
  type = string
  default = ""
}

variable "athena_region" {
  type = string
}

variable "input_prefix" {
  type = string
  default = ""
}

variable "input_suffix" {
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

variable "statements" {
  type = list(object({
    actions = list(string)
    resources = list(string)
  }))
  default = []
}

variable "timeout_secs" {
  type = number
  default = 40
}

variable "mem_mb" {
  type = number
  default = 256
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
