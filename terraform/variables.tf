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

variable supported_system_definitions {
  type = map(object({
    subsystems = map(object({
      serverless_site_configs = map(object({
        route53_zone_name = string
        domain_parts = object({
          top_level_domain = string
          controlled_domain_part = string
        })
      }))
    }))
  }))
  default = {
    prod = {
      subsystems = {
        prod = {
          serverless_site_configs = {
            raphaelluckom_com = {
              route53_zone_name = "raphaelluckom.com."
              domain_parts = {
                top_level_domain = "com"
                controlled_domain_part = "raphaelluckom"
              }
            }
          }
        }
        human = {
          serverless_site_configs = {}
        }
      }
    }
    test = {
      subsystems = {
        admin = {
          serverless_site_configs = {
            test_admin = {
              route53_zone_name = "raphaelluckom.com."
              domain_parts = {
                top_level_domain = "com"
                controlled_domain_part = "admin.raphaelluckom"
              }
            }
          }
        }
        test = {
          serverless_site_configs = {
            test = {
              route53_zone_name = "raphaelluckom.com."
              domain_parts = {
                top_level_domain = "com"
                controlled_domain_part = "test.raphaelluckom"
              }
            }
          }
        }
      }
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region = data.aws_region.current.name
}
