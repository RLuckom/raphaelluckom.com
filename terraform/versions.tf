provider "archive" {}

provider "aws" {
  shared_credentials_file = "/.aws/credentials"
  region     = "us-east-1"
  profile    = "default"
}

provider "aws" {
  shared_credentials_file = "/.aws/credentials"
  alias = "frankfurt"
  region     = "eu-central-1"
}

provider "aws" {
  shared_credentials_file = "/.aws/credentials"
  alias = "sydney"
  region     = "ap-southeast-2"
}

provider "aws" {
  shared_credentials_file = "/.aws/credentials"
  alias = "canada"
  region     = "ca-central-1"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.45"
    }
  }
  required_version = ">= 1.0"
  backend "s3" {
    shared_credentials_file = "/.aws/credentials"
    bucket = "raph"
    key    = "raphaelluckom.com"
    region = "us-east-1"
    profile    = "default"
  }
}
