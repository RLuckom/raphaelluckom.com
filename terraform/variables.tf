variable maintainer {
  default = {
    name = "Raphael Luckom"
    email = "raphaelluckom@gmail.com"
  }
}

variable nav_links {
  default = [{
    name = "Github"
    target = "https://github.com/RLuckom"
  }]
}

variable test_site_title {
  default = "Raphael Luckom's Test Site"
}

variable prod_site_title {
  default = "Raphael Luckom"
}

variable bucket_prefix {
  type = string
  default = "rluckom"
}

variable app_slack_channel {
  type = string
  default = "C01D71TDE0Z"
}

variable "domain_name" {
  type = string
  default = "raphaelluckom.com"
}

variable "slack_credentials_parameterstore_key" {
  type = string
  default = "/prod/slack/credentials.js"
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
    allowed_origins = ["http://localhost*", "https://raphaelluckom.com", "https://www.raphaelluckom.com"]
    subject_alternative_names = ["www.media.raphaelluckom.com"]
  }
}

variable "test_domain_settings" {
  type = object({
    domain_name = string
    domain_name_prefix = string
    allowed_origins = list(string)
    subject_alternative_names = list(string)
  })
  default = {
    domain_name = "test.raphaelluckom.com"
    domain_name_prefix = "test.raphaelluckom"
    allowed_origins = ["https://test.raphaelluckom.com", "http://localhost*"]
    subject_alternative_names = ["www.test.raphaelluckom.com"]
  }
}

variable "prod_domain_settings" {
  type = object({
    domain_name = string
    domain_name_prefix = string
    allowed_origins = list(string)
    subject_alternative_names = list(string)
  })
  default = {
    domain_name = "raphaelluckom.com"
    domain_name_prefix = "raphaelluckom"
    allowed_origins = ["https://raphaelluckom.com", "http://localhost*"]
    subject_alternative_names = ["www.raphaelluckom.com"]
  }
}

variable prod_domain_parts {
  default = {
    top_level_domain = "com"
    controlled_domain_part = "raphaelluckom"
  }
}

variable prod_additional_allowed_origins {
  default =  ["http://localhost*"]
}

variable test_domain_parts {
  default = {
    top_level_domain = "com"
    controlled_domain_part = "test.raphaelluckom"
  }
}

variable test_additional_allowed_origins {
  default =  ["http://localhost*"]
}

variable "cloudwatch_logs_table_name" {
  type = string
  default = "cloudwatch_logs"
}

variable "websocket_api_domain_name" {
  type = string
  default = "websocket.api.raphaelluckom.com"
}

variable "slack_api_domain_name" {
  type = string
  default = "slack.api.raphaelluckom.com"
}

variable "web_api_domain_name" {
  type = string
  default = "web.api.raphaelluckom.com"
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
  default = "rluckom-stream-input"
}

variable "scratch_bucket_name" {
  type = string
  default = "rluckom.scratch"
}

variable "classification_bucket_name" {
  type = string
  default = "rluckom.classification"
}

variable "classification_model_key" {
  type = string
  default = "intents.json"
}

variable "classification_table_name" {
  type = string
  default = "test_training_table"
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

variable "example_jpg" {
  type = object({ 
    bucket = string
    key = string
  })
  default = {
    bucket = "media.raphaelluckom.com"
    key = "images/2a5110b7-a6e6-4574-8c0b-2197edbc6607-100.JPG"
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
