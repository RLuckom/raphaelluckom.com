provider "aws" {
  shared_credentials_file = "/.aws/credentials"
  region     = "us-east-1"
}

terraform {
  backend "s3" {
    bucket = "raph"
    key    = "raphaelluckom.com"
    region = "us-east-1"
  }
}
