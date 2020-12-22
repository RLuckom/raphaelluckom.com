resource "aws_s3_bucket" "lambda_bucket" {
  bucket = var.lambda_bucket_name

  tags = {
    Name        = "lambda"
  }
}

module "scratch_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
  bucket = var.scratch_bucket_name

  bucket_policy_statements = [
    {
      actions = ["s3:GetBucketAcl"]
      principals = [{
        type = "Service"
        identifiers = ["logs.amazonaws.com" ]
      }]
    }]

    object_policy_statements = [{
      actions = ["s3:PutObject"]
      principals = [{
        type = "Service"
        identifiers = ["logs.amazonaws.com" ]
      }]
    }
  ]
}

module "donut_days" {
  source = "github.com/RLuckom/terraform_modules//aws/lambda_layer"
  layer_name = "donut_days"
  layer_path = "${path.root}/layers/donut_days/"
  source_bucket = aws_s3_bucket.lambda_bucket.id
  layer_zip_output_path = "${path.root}/layers/donut_days/layer.zip"
}

module "image_dependencies" {
  source = "github.com/RLuckom/terraform_modules//aws/lambda_layer"
  layer_name = "image_dependencies"
  layer_path = "${path.root}/layers/image_dependencies/"
  source_bucket = aws_s3_bucket.lambda_bucket.id
  layer_zip_output_path = "${path.root}/layers/image_dependencies/layer.zip"
}

module "markdown_tools" {
  source = "github.com/RLuckom/terraform_modules//aws/lambda_layer"
  layer_name = "markdown_tools"
  layer_path = "${path.root}/layers/markdown_tools/"
  source_bucket = aws_s3_bucket.lambda_bucket.id
  layer_zip_output_path = "${path.root}/layers/markdown_tools/layer.zip"
}

module "nlp" {
  source = "github.com/RLuckom/terraform_modules//aws/lambda_layer"
  layer_name = "nlp"
  layer_path = "${path.root}/layers/nlp/"
  source_bucket = aws_s3_bucket.lambda_bucket.id
  layer_zip_output_path = "${path.root}/layers/nlp/layer.zip"
}
