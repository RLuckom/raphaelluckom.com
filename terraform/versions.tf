provider "archive" {}

provider "aws" {
  shared_credentials_file = "/.aws/credentials"
  region     = "us-east-1"
}

terraform {
  required_providers {
    aws = {
      source = "registry.terraform.io/-/aws"
    }
  }
  required_version = ">= 0.13"
  backend "s3" {
    bucket = "raph"
    key    = "raphaelluckom.com"
    region = "us-east-1"
  }
}
