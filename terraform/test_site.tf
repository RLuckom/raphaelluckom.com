module test_site_plumbing {
  count = 1
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site_plumbing"
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.test_site_title
  asset_path = "${path.root}/sites/test.raphaelluckom.com/assets"
  site_bucket = "test.raphaelluckom.com"
  coordinator_data = module.visibility_data_coordinator.serverless_site_configs["test"]
  subject_alternative_names = ["www.test.raphaelluckom.com"]
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  trails_table_name = module.test_trails_table.table.name
  lambda_event_configs = local.notify_failure_only
  route53_zone_name = var.route53_zone_name
  layer_arns = {
    donut_days = module.donut_days.layer.arn,
    markdown_tools = module.markdown_tools.layer.arn,
  }
}

locals {
  test_trails_table_delete_role_names = length(module.test_site_plumbing) > 0 ? [
    module.test_site_plumbing[0].trails_updater_function.role_name
  ] : []
  test_trails_table_write_permission_role_names = length(module.test_site_plumbing) > 0 ? [
    module.test_site_plumbing[0].trails_updater_function.role_name
  ] : []
  test_trails_table_read_permission_role_names = length(module.test_site_plumbing) > 0 ? [
    module.test_site_plumbing[0].trails_resolver_function.role_name,
    module.test_site_plumbing[0].trails_updater_function.role_name
  ] : []
  test_website_bucket_lambda_notifications = length(module.test_site_plumbing) > 0 ? [
    {
      lambda_arn = module.test_site_plumbing[0].render_function.arn
      lambda_name = module.test_site_plumbing[0].render_function.name
      lambda_role_arn = module.test_site_plumbing[0].render_function.role_arn
      permission_type = "put_object"
      events              = ["s3:ObjectCreated:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    },
    {
      lambda_arn = module.test_site_plumbing[0].deletion_cleanup_function.arn
      lambda_name = module.test_site_plumbing[0].deletion_cleanup_function.name
      lambda_role_arn = module.test_site_plumbing[0].deletion_cleanup_function.role_arn
      permission_type = "delete_object"
      events              = ["s3:ObjectRemoved:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    }
  ] : []
  test_glue_table_permission_names = length(module.test_site_plumbing) > 0  ? module.test_site_plumbing[0].glue_table_permission_names : {}
  test_website_access_principals = length(module.test_site_plumbing) > 0 ? [module.test_site_plumbing[0].cloudfront_origin_access_principal] : []
}

module test_trails_table {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "test-trails_table"
  delete_item_permission_role_names = local.test_trails_table_delete_role_names
  write_permission_role_names = local.test_trails_table_write_permission_role_names
  read_permission_role_names = local.test_trails_table_read_permission_role_names
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

module test_website_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/website_bucket"
  name = module.visibility_data_coordinator.serverless_site_configs["test"].domain
  domain_parts = var.test_domain_parts
  additional_allowed_origins = var.test_additional_allowed_origins
  website_access_principals = local.test_website_access_principals
  lambda_notifications = local.test_website_bucket_lambda_notifications
}

module test_data_warehouse {
  source = "github.com/RLuckom/terraform_modules//aws/state/data_warehouse"
  scope = "test"
  data_bucket = module.visibility_data_coordinator.visibility_data_bucket
  database_name = module.visibility_data_coordinator.data_warehouse_configs["test"].glue_database_name
  table_configs = module.visibility_data_coordinator.data_warehouse_configs["test"].glue_table_configs
  table_permission_names = local.test_glue_table_permission_names
}
