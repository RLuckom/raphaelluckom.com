module test_site_plumbing {
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

module test_trails_table {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "test-trails_table"
  delete_item_permission_role_names = [
    module.test_site_plumbing.trails_updater_function.role_name
  ]
  write_permission_role_names = [
    module.test_site_plumbing.trails_updater_function.role_name
  ]
  read_permission_role_names = [
    module.test_site_plumbing.trails_resolver_function.role_name,
    module.test_site_plumbing.trails_updater_function.role_name
  ]
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
  website_access_principals = [module.test_site_plumbing.cloudfront_origin_access_principal]

  lambda_notifications = [
    {
      lambda_arn = module.test_site_plumbing.deletion_cleanup_function.arn
      lambda_name = module.test_site_plumbing.deletion_cleanup_function.name
      lambda_role_arn = module.test_site_plumbing.deletion_cleanup_function.role_arn
      permission_type = "delete_object"
      events              = ["s3:ObjectRemoved:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    },
    {
      lambda_arn = module.test_site_plumbing.render_function.arn
      lambda_name = module.test_site_plumbing.render_function.name
      lambda_role_arn = module.test_site_plumbing.render_function.role_arn
      permission_type = "put_object"
      events              = ["s3:ObjectCreated:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    }
  ]
}

module test_data_warehouse {
  source = "github.com/RLuckom/terraform_modules//aws/state/data_warehouse"
  scope = "test"
  data_bucket = module.visibility_data_coordinator.visibility_data_bucket
  database_name = module.visibility_data_coordinator.data_warehouse_configs["test"].glue_database_name
  table_configs = module.visibility_data_coordinator.data_warehouse_configs["test"].glue_table_configs
  table_permission_names = module.test_site_plumbing.glue_table_permission_names
}
