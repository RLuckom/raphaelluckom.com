module "test_training_table" {
  source = "github.com/RLuckom/terraform_modules//aws/standard_dynamo_table"
  table_name = var.classification_table_name
  partition_key = {
    name = "class"
    type = "S"
  }
  range_key = {
    name = "timeAdded"
    type = "N"
  }
}

module "test_classifier_crud_lambda" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("./functions/templates/generic_donut_days/index.js") 
    },
    {
      file_name = "helpers.js"
      file_contents = file("./functions/templates/generic_donut_days/helpers.js") 
    },
    {
      file_name = "recordCollectors.js"
      file_contents = file("./functions/templates/classify/recordCollectors.js") 
    },
    {
      file_name = "config.js"
      file_contents = templatefile("./functions/templates/classify/config.js",
      {
        classification_table_name = module.test_training_table.table.name
        classification_model = {
          bucket = module.classification_model_bucket.bucket.id,
          key = var.classification_model_key,
        }
      }
    )
    }
  ]
  lambda_details = {
    action_name = "classify"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      module.classification_model_bucket.permission_sets.read_write_objects,
      module.test_training_table.permission_sets.write,
      module.test_training_table.permission_sets.read,
      module.test_training_table.permission_sets.delete_item,
    )
  }
  environment_var_map = {
    DONUT_DAYS_DEBUG = "true"
  }
  layers = [
    aws_lambda_layer_version.donut_days.arn,
    aws_lambda_layer_version.nlp.arn
  ]
}

module "classification_model_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
  bucket = var.classification_bucket_name
}
