module "test_site_plumbing" {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site_plumbing"
  domain_parts = var.test_domain_parts
  purpose_descriptor = "test"
  site_bucket = "test.raphaelluckom.com"
  subject_alternative_names = ["www.test.raphaelluckom.com"]
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  default_lambda_logging_config = local.test_site_lambda_logging_config
  site_logging_config = local.test_site_cloudfront_logging_config 
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
      lambda_arn = module.test_site_plumbing.render_function.arn
      lambda_name = module.test_site_plumbing.render_function.name
      lambda_role_arn = module.test_site_plumbing.render_function.role_arn
      permission_type = "put_object"
      events              = ["s3:ObjectCreated:*" ]
      filter_prefix       = ""
      filter_suffix       = ".md"
    },
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


module test_logging_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket"
  bucket_name = "logs.test.raphaelluckom.com"
}

module "lambda_logging_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket"
  bucket_name = "logs.rluckom-lambda-logging"
}

resource "aws_glue_catalog_database" "lambda_logs" {
  name = "lambda_logs"
}

module "lambda_logging_table" {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_glue_table"
  table_name          = "lambda_logs"
  external_storage_bucket_id = module.lambda_logging_bucket.bucket.id
  db = {
    name = aws_glue_catalog_database.lambda_logs.name
    arn = aws_glue_catalog_database.lambda_logs.arn
  }
  skip_header_line_count = 0
  ser_de_info = {
    name                  = "lambda_logs"
    serialization_library = "org.openx.data.jsonserde.JsonSerDe"
    parameters = {}
  }
  columns = module.temporary_schemas.lambda_log_columns
}

module "throwaway_athena_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket"
  bucket_name = "rluckom-athena-throwaway"
}

module "throwaway_partition_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_bucket"
  bucket = "rluckom-partition-throwaway"
}

module "throwaway_log_input_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_bucket"
  bucket = "rluckom-log-input-throwaway"
  lambda_notifications = [
    {
      lambda_arn = module.test_glue_pipeline.ingest_function.lambda.arn
      lambda_name = module.test_glue_pipeline.ingest_function.lambda.function_name
      lambda_role_arn = module.test_glue_pipeline.ingest_function.role.arn
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = ""
      filter_suffix       = ""
      permission_type       = "move_known_object_out"
    }
  ]
}

module test_glue_pipeline {
  source = "./modules/glue_pipeline"
  name_stem = "test_glue_pipeline"
  athena_results = {
    bucket = module.throwaway_athena_bucket.bucket.id
    path = "athena/partition_logs/"
  }
  partitioned_data_sink = local.test_glue_pipe_logging_config
  lambda_source_bucket = aws_s3_bucket.lambda_bucket.id
  ser_de_info = {
    name                  = "test_sink"
    serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
    parameters = {
      "field.delim"="\t"
      "serialization.format"="\t"
    }
  }
  columns = module.temporary_schemas.cloudfront_access_log_columns
}
