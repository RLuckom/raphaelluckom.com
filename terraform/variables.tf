variable "domain_name" {
  type = string
  default = "raphaelluckom.com"
}

variable "subject_alternative_names" {
  type = list(string)
  default = ["www.raphaelluckom.com"]
}

variable "domain_name_prefix" {
  type = string
  default = "raphaelluckom"
}

variable "route53_zone_name" {
  type = string
  default = "raphaelluckom.com."
}

variable "media_domain_settings" {
  type = object({
    domain_name = string
    domain_name_prefix = string
    allowed_origins = list(string)
    subject_alternative_names = list(string)
  })
  default = {
    domain_name = "media.raphaelluckom.com"
    domain_name_prefix = "media.raphaelluckom"
    allowed_origins = ["https://media.raphaelluckom.com", "http://localhost*"]
    subject_alternative_names = ["www.media.raphaelluckom.com"]
  }
}

variable "cloudwatch_logs_table_name" {
  type = string
  default = "cloudwatch_logs"
}

variable "api_domain_name" {
  type = string
  default = "api.raphaelluckom.com"
}

variable "athena_db_name" {
  type = string
  default = "raphaelluckomcf"
}

variable "partition_prefix" {
  type = string
  default = "partitioned"
}

variable "cloudwatch_partition_prefix" {
  type = string
  default = "partitioned/cloudwatch"
}

variable "athena_region" {
  type = string
  default = "us-east-1"
}

variable "time_series_db_name" {
  type = string
  default = "timeseries"
}

variable "partitioned_bucket_name" {
  type = string
  default = "rluckom.timeseries"
}

variable "athena_bucket_name" {
  type = string
  default = "rluckom.athena"
}

variable "lambda_bucket_name" {
  type = string
  default = "rluckom.lambda"
}

variable "stream_input_bucket_name" {
  type = string
  default = "rluckom.stream.input"
}

variable "scratch_bucket_name" {
  type = string
  default = "rluckom.scratch"
}

variable "json_ser_de" {
  type = object({
    name = string
    serialization_library = string
    parameters = map(string)
  })
  default = {
    name                  = "json-ser-de"
    serialization_library = "org.openx.data.jsonserde.JsonSerDe"
    parameters = {
      "explicit.null"="true"
      "ignore.malformed.json"="true"
    }
  }
}
