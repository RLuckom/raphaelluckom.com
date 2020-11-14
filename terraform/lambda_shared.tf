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

resource "aws_lambda_layer_version" "donut_days" {
  layer_name = "donut_days"
  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key = "layers/donut_days/layer.zip"
  compatible_runtimes = ["nodejs12.x"]
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lambda_layer_version" "nlp" {
  layer_name = "nlp"
  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key = "layers/nlp/layer.zip"
  compatible_runtimes = ["nodejs12.x"]
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lambda_layer_version" "image_dependencies" {
  layer_name = "image_dependencies"
  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key = "layers/image_dependencies/layer.zip"
  compatible_runtimes = ["nodejs12.x"]
  lifecycle {
    create_before_destroy = true
  }
}
