variable "domain_name" {
  type = string
  default = "raphaelluckom.com"
}

variable "api_domain_name" {
  type = string
  default = "api.raphaelluckom.com"
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

variable "athena_query_policy" {
  type = list(object({
    actions = list(string)
    resources = list(string)
  }))
  default = [{
		actions   =  [
			"athena:StartQueryExecution",
			"athena:GetQueryResults",
			"athena:GetQueryExecution"
		]
		resources = [
			"arn:aws:athena:*"
		]
	}]
}

variable "cloudwatch_log_read_policy" {
  type = list(object({
    actions = list(string)
    resources = list(string)
  }))
  default = [{
		actions   =  [
      "logs:DescribeLogGroups"
		]
		resources = [
			"arn:aws:logs:*"
		]
	}]
}

variable "allow_rekognition_policy" {
  type = list(object({
    actions = list(string)
    resources = list(string)
  }))
  default = [{
      actions = [
        "rekognition:DetectLabels",
        "rekognition:DetectFaces",
        "rekognition:DetectText"
      ]
      resources = ["*"]
    }
  ]
}
