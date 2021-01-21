module "test_site_plumbing" {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site_plumbing?ref=tape-deck-storage"
  site_bucket = "test.raphaelluckom.com"
  coordinator_data = module.visibility_data_coordinator.serverless_site_configs["test"]
  subject_alternative_names = ["www.test.raphaelluckom.com"]
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  trails_table = {
    name = module.test_trails_table.table.name
    permission_sets = {
      read = module.test_trails_table.permission_sets.read
      write = module.test_trails_table.permission_sets.write
      delete_item = module.test_trails_table.permission_sets.delete_item
    }
  }
  site_description_content = file("./sites/test.raphaelluckom.com/site_description.json")
  lambda_event_configs = local.notify_failure_only
  route53_zone_name = var.route53_zone_name
  layer_arns = {
    donut_days = module.donut_days.layer.arn,
    markdown_tools =module.markdown_tools.layer.arn,
  }
}

module "test_trails_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "test-trails_table"
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

module "test_website_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_website_bucket"
  domain_parts = var.test_domain_parts
  additional_allowed_origins = var.test_additional_allowed_origins

  lambda_notifications = [
    {
      lambda_arn = module.test_site_plumbing.deletion_cleanup_function.arn
      lambda_name = module.test_site_plumbing.deletion_cleanup_function.name
      lambda_role_arn = module.test_site_plumbing.deletion_cleanup_function.role_arn
      permission_type = "delete_object"
      events              = ["s3:ObjectRemoved:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    }
  ]
}

module test_data_warehouse {
  source = "github.com/RLuckom/terraform_modules//aws/state/data_warehouse?ref=tape-deck-storage"
  scope = "test"
  data_bucket = module.visibility_data_coordinator.visibility_data_bucket
  database_name = module.visibility_data_coordinator.data_warehouse_configs["test"].glue_database_name
  table_configs = module.visibility_data_coordinator.data_warehouse_configs["test"].glue_table_configs
}
