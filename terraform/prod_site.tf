module "prod_site_plumbing" {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site_plumbing"
  domain_parts = var.prod_domain_parts
  purpose_descriptor = "prod"
  site_bucket = "raphaelluckom.com"
  subject_alternative_names = ["www.raphaelluckom.com"]
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  lambda_logging_bucket = module.lambda_logging_bucket.bucket.id
  site_logging_bucket = module.prod_logging_bucket.bucket.id
  trails_table = {
    name = module.prod_trails_table.table.name
    permission_sets = {
      read = module.prod_trails_table.permission_sets.read
      write = module.prod_trails_table.permission_sets.write
      delete_item = module.prod_trails_table.permission_sets.delete_item
    }
  }
  site_description_content = file("./sites/raphaelluckom.com/site_description.json")
  lambda_event_configs = local.notify_failure_only
  debug = false
  route53_zone_name = var.route53_zone_name
  layer_arns = {
    donut_days = module.donut_days.layer.arn,
    markdown_tools =module.markdown_tools.layer.arn,
  }
}

module "prod_trails_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "prod-trails_table"
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

module "prod_website_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_website_bucket"
  domain_parts = var.prod_domain_parts
  additional_allowed_origins = var.prod_additional_allowed_origins

  lambda_notifications = [
    {
      lambda_arn = module.prod_site_plumbing.render_function.arn
      lambda_name = module.prod_site_plumbing.render_function.name
      lambda_role_arn = module.prod_site_plumbing.render_function.role_arn
      permission_type = "put_object"
      events              = ["s3:ObjectCreated:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    },
    {
      lambda_arn = module.prod_site_plumbing.deletion_function.arn
      lambda_name = module.prod_site_plumbing.deletion_function.name
      lambda_role_arn = module.prod_site_plumbing.deletion_function.role_arn
      permission_type = "delete_object"
      events              = ["s3:ObjectRemoved:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    }
  ]
}

module "prod_logging_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket"
  bucket_name = "raphaelluckom.com"
}
