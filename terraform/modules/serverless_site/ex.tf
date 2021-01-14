module "trails_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "${var.site_name}-trails_table"
  partition_key = {
    name = "trailName"
    type = "S"
  }
  range_key = {
    name = "memberKey"
    type = "S"
  }
  global_indexes = [
    {
      name = "reverseDependencyIndex"
      hash_key = "memberKey"
      range_key = "trailName"
      write_capacity = 0
      read_capacity = 0
      projection_type = "ALL"
      non_key_attributes = []
    }
  ]
}

module "website_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_website_bucket"
  bucket_name = var.domain_settings.domain_name
  origin_id = var.domain_settings.domain_name_prefix
  allowed_origins = var.domain_settings.allowed_origins

  lambda_notifications = [
    {
      lambda_arn = module.site_render.lambda.arn
      lambda_name = module.site_render.lambda.function_name
      lambda_role_arn = module.site_render.role.arn
      permission_type = "put_object"
      events              = ["s3:ObjectCreated:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    },
    {
      lambda_arn = module.deletion_cleanup.lambda.arn
      lambda_name = module.deletion_cleanup.lambda.function_name
      lambda_role_arn = module.deletion_cleanup.role.arn
      permission_type = "delete_object"
      events              = ["s3:ObjectRemoved:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    }
  ]
}

module "logging_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket"
  bucket_name = var.domain_settings.domain_name
}
