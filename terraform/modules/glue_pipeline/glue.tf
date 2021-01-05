resource "aws_glue_catalog_database" "database" {
  count = var.glue_database == "" ? 1 : 0
  name = var.name_stem
}

locals {
  athena_query_permission = [{
    actions   =  [
      "athena:StartQueryExecution",
      "athena:GetQueryResults",
      "athena:GetQueryExecution"
    ]
    resources = [
      "arn:aws:athena:*"
    ]
  }]
}

module "archive_function" {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  timeout_secs = 15
  mem_mb = 128
  debug = true
  log_bucket = var.lambda_log_bucket
  config_contents = templatefile("${path.root}/functions/configs/s3_to_athena.js",
  {
    athena_region = var.athena_region
    athena_db = module.glue_table.table.database_name
    athena_table = module.glue_table.table.name 
    athena_catalog = "AwsDataCatalog"
    athena_result_bucket = "s3://${var.athena_result_bucket.id}"
    partition_prefix = var.partitioned_data_sink.prefix
    partition_bucket = var.partitioned_data_sink.bucket
  })
  lambda_event_configs = var.lambda_event_configs
  additional_helpers = [
    {
      helper_name = "athenaHelpers.js",
      file_contents = file("${path.root}/functions/libraries/src/helpers/athenaHelpers.js")
    }
  ]
  action_name = "cloudfront_log_collector"
  scope_name = var.name_stem
  policy_statements = concat(
    local.athena_query_permission,
    module.glue_table.permission_sets.create_partition_glue_permissions,
    var.partitioned_data_sink.put_object_permission,
    var.athena_result_bucket.athena_query_permission,
  )
  source_bucket = var.lambda_source_bucket
  donut_days_layer_arn = var.donut_days_layer_arn
}

module "glue_table" {
  source = "github.com/RLuckom/terraform_modules//aws/standard_glue_table"
  table_name          = var.name_stem
  external_storage_bucket_id = var.partitioned_data_sink.bucket
  partition_prefix = var.partitioned_data_sink.prefix
  db = {
    name = length(var.glue_database) > 0 ? var.glue_database[0].name : aws_glue_catalog_database.database[0].name
    arn = length(var.glue_database) > 0 ? var.glue_database[0].arn : aws_glue_catalog_database.database[0].arn
  }
  skip_header_line_count = 2
  ser_de_info = var.ser_de_info 
  columns = var.columns
}
