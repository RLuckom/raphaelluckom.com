resource "aws_glue_catalog_database" "time_series_db" {
  name = "rluckom_photos_timeseries"
}

module "photos_input_bucket" {
  source = "./modules/permissioned_bucket"
  bucket = "rluckom.photos.input"
}

module "photos_athena_result_bucket" {
  source = "./modules/permissioned_bucket"
  bucket = "rluckom.photos.athena"
}

resource "aws_s3_bucket" "photos_partition" {
  bucket = "rluckom.photos.partition"
}

module "photos_lambda" {
  source = "./modules/permissioned_lambda"
  environment_var_map = {
    INPUT_BUCKET = module.photos_input_bucket.bucket.id
    PARTITION_BUCKET = aws_s3_bucket.photos_partition.id
    PARTITION_PREFIX = var.partition_prefix
    METADATA_PARTITION_BUCKET = module.photos_metadata_glue_table.metadata_bucket.id,
    ATHENA_RESULT_BUCKET = module.photos_athena_result_bucket.bucket.id
    ATHENA_TABLE = module.photos_metadata_glue_table.table.name 
    ATHENA_DB = module.photos_metadata_glue_table.table.database_name
    ATHENA_REGION = var.athena_region
  }
  lambda_details = {
    name = "rluckom_photos"
    bucket = aws_s3_bucket.lambda_bucket.id
    key = "rluckom.photos/lambda.zip"

    policy_statements = concat(
      var.athena_query_policy,
      var.allow_rekognition_policy,
      module.photos_athena_result_bucket.permission_sets.athena_query_execution,
      module.photos_input_bucket.permission_sets.move_objects_out,
      module.photos_metadata_glue_table.permission_sets.create_partition_glue_permissions,
      [
    {
      actions   =  [
        "s3:PutObject"
      ]
      resources = [
        "${module.photos_metadata_glue_table.metadata_bucket.arn}/*",
        "${aws_s3_bucket.photos_partition.arn}/*"
      ]
    }])
  }

  bucket_notifications = [{
    bucket = module.photos_input_bucket.bucket.id
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ""
  }]
}

module "photo_analysis_complete_queue" {
  source = "./modules/queue_with_deadletter"
  queue_name = "photo_analysis_complete"
  maxReceiveCount = 3
}

module "photos_metadata_glue_table" {
  source = "./modules/standard_glue_table"
  table_name          = "rluckom_photos_partitioned_gz"
  metadata_bucket_name = "rluckom.photos.metadata"
  db = {
    name = aws_glue_catalog_database.time_series_db.name
    arn = aws_glue_catalog_database.time_series_db.arn
  }
  ser_de_info = var.json_ser_de
  columns = local.images_glue_schema.columns
}
