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
      MEDIA_STORAGE_PREFIX = "images"
      MEDIA_DYNAMO_TABLE = module.media_table.table.name
      MEDIA_TYPE = "IMAGE"
    }
  }
}

module "archive_image_jpg_lambda" {
  source = "./modules/permissioned_lambda"
  environment_var_map = local.photo_etl_env.ingest
  mem_mb = 384
  timeout_secs = 20
  lambda_details = {
    action_name = "archive_image_jpg"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      module.media_table.permission_sets.put_item,
      local.permission_sets.rekognition_image_analysis,
      module.media_input_bucket.permission_sets.read_and_tag,
      module.stream_input_bucket.permission_sets.read_and_tag,
      module.photos_media_output_bucket.permission_sets.put_object
    )
  }
}

module "jpg_resize_lambda" {
  source = "./modules/permissioned_lambda"
  mem_mb = 512
  timeout_secs = 20
  lambda_details = {
    action_name = "jpg_image_resize"
    scope_name = ""
    bucket = aws_s3_bucket.lambda_bucket.id

    policy_statements = concat(
      module.stream_input_bucket.permission_sets.read_and_tag,
      module.media_hosting_bucket.website_bucket.permission_sets.put_object 
    )
  }
}
