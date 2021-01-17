module "media_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_website_bucket"
  domain_parts = {
    top_level_domain = "com"
    controlled_domain_part = "media.raphaelluckom"
  }
  additional_allowed_origins = var.media_domain_settings.allowed_origins
  object_policy_statements = [
    local.media_storage_policy,
  ]
}

module "media_logging_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/state/objectstore/permissioned_logging_bucket"
  bucket_name = "logs.${var.media_domain_settings.domain_name}"
}

module "media_hosting_site" {
  source = "github.com/RLuckom/terraform_modules//aws/cloudfront_s3_website"
  website_buckets = [{
    origin_id = "media.raphaelluckom"
    regional_domain_name = "media.raphaelluckom.com.s3.amazonaws.com"
  }]
  logging_config = local.media_site_cloudfront_logging_config
  route53_zone_name = var.route53_zone_name
  domain_name = var.media_domain_settings.domain_name
  allowed_origins = var.media_domain_settings.allowed_origins
  controlled_domain_part = var.media_domain_settings.domain_name_prefix
  subject_alternative_names = var.media_domain_settings.subject_alternative_names
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
