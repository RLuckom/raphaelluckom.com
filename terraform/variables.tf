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

variable "slack_credentials_parameterstore_key" {
  type = string
  default = "/prod/slack/credentials.js"
}

variable "route53_zone_name" {
  type = string
  default = "raphaelluckom.com."
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
