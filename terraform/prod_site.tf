module prod_site_plumbing {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site_plumbing"
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.prod_site_title
  site_bucket = "raphaelluckom.com"
  coordinator_data = module.visibility_data_coordinator.serverless_site_configs["prod"]
  subject_alternative_names = ["www.raphaelluckom.com"]
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  trails_table_name  = module.prod_trails_table.table.name
  site_description_content = file("./sites/raphaelluckom.com/site_description.json")
  lambda_event_configs = local.notify_failure_only
  route53_zone_name = var.route53_zone_name
  layer_arns = {
    donut_days = module.donut_days.layer.arn,
    markdown_tools =module.markdown_tools.layer.arn,
  }
}

module prod_trails_table {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  table_name = "prod-trails_table"
  delete_item_permission_role_names = [
    module.prod_site_plumbing.trails_updater_function.role_name
  ]
  write_permission_role_names = [
    module.prod_site_plumbing.trails_updater_function.role_name
  ]
  read_permission_role_names = [
    module.prod_site_plumbing.trails_resolver_function.role_name,
    module.prod_site_plumbing.trails_updater_function.role_name
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

module prod_website_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/website_bucket"
  domain_parts = var.prod_domain_parts
  name = module.visibility_data_coordinator.serverless_site_configs["prod"].domain
  additional_allowed_origins = var.prod_additional_allowed_origins
  website_access_principals = [module.prod_site_plumbing.cloudfront_origin_access_principal]

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
      lambda_arn = module.prod_site_plumbing.deletion_cleanup_function.arn
      lambda_name = module.prod_site_plumbing.deletion_cleanup_function.name
      lambda_role_arn = module.prod_site_plumbing.deletion_cleanup_function.role_arn
      permission_type = "delete_object"
      events              = ["s3:ObjectRemoved:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    }
  ]
}

module prod_data_warehouse {
  source = "github.com/RLuckom/terraform_modules//aws/state/data_warehouse"
  scope = "prod"
  data_bucket = module.visibility_data_coordinator.visibility_data_bucket
  database_name = module.visibility_data_coordinator.data_warehouse_configs["prod"].glue_database_name
  table_configs = module.visibility_data_coordinator.data_warehouse_configs["prod"].glue_table_configs
  table_permission_names = module.prod_site_plumbing.glue_table_permission_names
}
