variable "route53_zone_name" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "domain_name_prefix" {
  type = string
}

variable "subject_alternative_names" {
  type = list(string)
}
