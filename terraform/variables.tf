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
