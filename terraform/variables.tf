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

variable "partitioned_bucket_name" {
  type = string
  default = "rluckom.timeseries"
}

variable "athena_bucket_name" {
  type = string
  default = "rluckom.athena"
}

variable "athena_db_name" {
  type = string
  default = "raphaelluckomcf"
}

variable "partition_prefix" {
  type = string
  default = "partitioned"
}

variable athena_region {
  type = string
  default = "us-east-1"
}

variable "rotation_period_expression" {
  type = string
	default = "rate(45 minutes)"
}

variable "time_series_db_name" {
  type = string
  default = "timeseries"
}
