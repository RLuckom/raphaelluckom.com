provider "archive" {}

provider "aws" {
  shared_credentials_files = ["~/.aws/credentials"]
  region     = "us-east-1"
  profile    = "default"
}

provider "aws" {
  shared_credentials_files = ["~/.aws/credentials"]
  alias = "frankfurt"
  region     = "eu-central-1"
}

provider "aws" {
  shared_credentials_files = ["~/.aws/credentials"]
  alias = "sydney"
  region     = "ap-southeast-2"
}

provider "aws" {
  shared_credentials_files = ["~/.aws/credentials"]
  alias = "canada"
  region     = "ca-central-1"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.12.0"
    }
  }
  required_version = ">= 1.2.4"
  backend "s3" {
    shared_credentials_file = "~/.aws/credentials"
    bucket = "raph"
    key    = "raphaelluckom.com"
    region = "us-east-1"
    profile    = "default"
  }
}
