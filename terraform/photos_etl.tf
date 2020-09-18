module "photos_athena_result_bucket" {
  source = "./modules/permissioned_bucket"
  bucket = "rluckom.photos.athena"
}

module "photos_media_output_bucket" {
  source = "./modules/permissioned_bucket"
  bucket = "rluckom.photos.partition"
}

locals {
  photo_etl_bucket_notifications = [{
    bucket = module.media_input_bucket.bucket.id
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ""
  }]
  photo_etl_env = {
    ingest = {
      MEDIA_STORAGE_BUCKET = module.photos_media_output_bucket.bucket.id
      MEDIA_DYNAMO_TABLE = module.media_table.table.name
      MEDIA_TYPE = "IMAGE"
      MEDIA_METADATA_TABLE_BUCKET = module.photos_metadata_glue_table.metadata_bucket[0].bucket.id
      ATHENA_RESULT_BUCKET = module.photos_athena_result_bucket.bucket.id
      ATHENA_TABLE = module.photos_metadata_glue_table.table.name
      ATHENA_DB = module.photos_metadata_glue_table.table.database_name
    }
  }
}

module "photos_lambda" {
  source = "./modules/permissioned_lambda"
  environment_var_map = local.photo_etl_env.ingest
  mem_mb = 384
  timeout_secs = 20
  lambda_details = {
    name = "rluckom_photos"
    bucket = aws_s3_bucket.lambda_bucket.id
    key = "rluckom.photos/lambda.zip"

    policy_statements = concat(
      module.media_table.permission_sets.put_item,
      local.permission_sets.athena_query,
      local.permission_sets.rekognition_image_analysis,
      module.photos_athena_result_bucket.permission_sets.athena_query_execution,
      module.media_input_bucket.permission_sets.move_objects_out,
      module.media_input_bucket.permission_sets.put_object_tagging,
      module.photos_metadata_glue_table.permission_sets.create_partition_glue_permissions,
      module.photos_media_output_bucket.permission_sets.put_object,
      module.photos_metadata_glue_table.metadata_bucket[0].permission_sets.put_object
    )
  }
}

module "photos_metadata_glue_table" {
  source = "./modules/standard_glue_table"
  table_name          = "rluckom_photos_partitioned_gz"
  metadata_bucket_name = "rluckom.photos.metadata"
  db = {
    name = aws_glue_catalog_database.media_db.name
    arn = aws_glue_catalog_database.media_db.arn
  }
  ser_de_info = var.json_ser_de
  columns = local.images_glue_schema.columns
}
