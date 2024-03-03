module activitypub_utils {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/activitypub_utils"
}

module archive_utils {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/archive_utils"
}

module csv_parser {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/csv_parser"
}

module "node_jose" {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/node_jose"
}

module "aws_sdk" {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/aws_sdk"
}

module "donut_days" {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/donut_days"
}

module "image_dependencies" {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/image_dependencies"
}

module "markdown_tools" {
  source = "github.com/RLuckom/terraform_modules//snapshots/aws/layers/markdown_tools"
}
