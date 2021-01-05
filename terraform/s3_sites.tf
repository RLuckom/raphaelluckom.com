module "media_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_website_bucket"
  bucket_name = var.media_domain_settings.domain_name
  origin_id = var.media_domain_settings.domain_name_prefix
  allowed_origins = var.media_domain_settings.allowed_origins
}

module "media_logging_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_logging_bucket"
  bucket_name = var.media_domain_settings.domain_name
}

module "media_hosting_site" {
  source = "github.com/RLuckom/terraform_modules//aws/cloudfront_s3_website"
  website_buckets = [module.media_bucket.cloudfront_origin]
  logging_config = module.media_logging_bucket.cloudfront_logging
  route53_zone_name = var.route53_zone_name
  domain_name = var.media_domain_settings.domain_name
  allowed_origins = var.media_domain_settings.allowed_origins
  domain_name_prefix = var.media_domain_settings.domain_name_prefix
  subject_alternative_names = var.media_domain_settings.subject_alternative_names
}

module "lambda_logging_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_logging_bucket"
  bucket_name = "rluckom-lambda-logging"
}

module "test_site" {
  source = "./modules/serverless_site"
  domain_settings = var.test_domain_settings
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  logging_bucket = module.lambda_logging_bucket.bucket.bucket.id
  site_description_content = file("./sites/test.raphaelluckom.com/site_description.json")
  site_name = "test"
  debug = false
  lambda_event_configs = local.notify_failure_only
  route53_zone_name = var.route53_zone_name
  layer_arns = {
    donut_days = module.donut_days.layer.arn,
    markdown_tools =module.markdown_tools.layer.arn,
  }
}


module "throwaway_athena_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_logging_bucket"
  bucket_name = "rluckom-athena-throwaway"
}

module "throwaway_partition_bucket" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_bucket"
  bucket = "rluckom-partition-throwaway"
}

module test_glue_pipeline {
  source = "./modules/glue_pipeline"
  name_stem = "test_glue_pipeline"
  athena_result_bucket = {
    id = module.throwaway_athena_bucket.bucket.bucket.id
    athena_query_permission = module.throwaway_athena_bucket.bucket.permission_sets.athena_query_execution
  }
  partitioned_data_sink = {
    bucket = module.throwaway_partition_bucket.bucket.id
    prefix = ""
    put_object_permission = module.throwaway_partition_bucket.permission_sets.put_object
  }
  lambda_source_bucket = aws_s3_bucket.lambda_bucket.id
  ser_de_info = {
    name                  = "test_sink"
    serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
    parameters = {
      "field.delim"="\t"
      "serialization.format"="\t"
    }
  }
  columns = local.cloudfront_access_log_schema.columns
}

module "prod_site" {
  source = "./modules/serverless_site"
  domain_settings = var.prod_domain_settings
  lambda_bucket = aws_s3_bucket.lambda_bucket.id
  logging_bucket = module.lambda_logging_bucket.bucket.bucket.id
  site_description_content = file("./sites/raphaelluckom.com/site_description.json")
  lambda_event_configs = local.notify_failure_only
  site_name = "prod"
  debug = false
  route53_zone_name = var.route53_zone_name
  layer_arns = {
    donut_days = module.donut_days.layer.arn,
    markdown_tools =module.markdown_tools.layer.arn,
  }
}
