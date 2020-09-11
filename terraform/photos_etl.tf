resource "aws_glue_catalog_database" "time_series_db" {
  name = "rluckom_photos_timeseries"
}

resource "aws_s3_bucket" "photos_input" {
  bucket = "rluckom.photos.input"
}

resource "aws_s3_bucket" "photos_athena_result" {
  bucket = "rluckom.photos.athena"
}

resource "aws_s3_bucket" "photos_partition" {
  bucket = "rluckom.photos.partition"
}

module "photos_lambda" {
  source = "./modules/permissioned_lambda"
  environment_var_map = {
    INPUT_BUCKET = aws_s3_bucket.photos_input.id
    PARTITION_BUCKET = aws_s3_bucket.photos_partition.id
    PARTITION_PREFIX = var.partition_prefix
    METADATA_PARTITION_BUCKET = module.photos_metadata_glue_table.metadata_bucket.id,
    ATHENA_RESULT_BUCKET = aws_s3_bucket.photos_athena_result.id
    ATHENA_TABLE = module.photos_metadata_glue_table.table.name 
    ATHENA_DB = module.photos_metadata_glue_table.table.database_name
    ATHENA_REGION = var.athena_region
  }
  lambda_details = {
    name = "rluckom_photos"
    bucket = aws_s3_bucket.lambda_bucket.id
    key = "rluckom.photos/lambda.zip"
    policy_statements = concat(var.athena_query_policy, var.allow_rekognition_policy, [{
      actions   =  [
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      resources = [
        aws_s3_bucket.photos_input.arn,
        "${aws_s3_bucket.photos_input.arn}/*"
      ]
    },
    {
      actions   =  [
        "s3:GetObject",
        "s3:ListMultipartUploadParts",
        "s3:PutObject",
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ]
      resources = [
        aws_s3_bucket.photos_athena_result.arn,
        "${aws_s3_bucket.photos_athena_result.arn}/*"
      ]
    },
    {
      actions   =  [
        "glue:CreatePartition",
        "glue:GetTable",
        "glue:GetDatabase",
        "glue:BatchCreatePartition"
      ]
      resources = [
        aws_glue_catalog_database.time_series_db.arn,
        module.photos_metadata_glue_table.table.arn,
        "arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog",
        "arn:aws:glue:us-east-1:${data.aws_caller_identity.current.account_id}:catalog*"
      ]
    },
    {
      actions   =  [
        "s3:PutObject"
      ]
      resources = [
        "${module.photos_metadata_glue_table.metadata_bucket.arn}/*",
        "${aws_s3_bucket.photos_partition.arn}/*",
        "${aws_s3_bucket.photos_athena_result.arn}/*"
      ]
    }])
  }

  bucket_notifications = [{
    bucket = aws_s3_bucket.photos_input.id
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ""
  }]
}

module "photo_analysis_complete" {
  source = "./modules/queue_with_deadletter"
  queue_name = "photo_analysis_complete"
  maxReceiveCount = 3
}

module "photos_metadata_glue_table" {
  source = "./modules/standard_glue_table"
  table_name          = "rluckom_photos_partitioned_gz"
  metadata_bucket_name = "rluckom.photos.metadata"
  db_name = aws_glue_catalog_database.time_series_db.name
  ser_de_info = var.json_ser_de
  columns = [
    {
      name = "time"
      type = "timestamp"
    },
    {
      name = "bucket"
      type = "string"
    },
    {
      name = "key"
      type = "string"
    },
    {
      name = "mediabucket"
      type = "string"
    },
    {
      name = "mediakey"
      type = "string"
    },
    {
      name = "fullmeta"
      type = "string"
    },
    {
      name = "gps"
      type = "struct<Latitude:float,Longitude:float,Altitude:float>"
    },
    {
      name = "metadata"
      type = "struct<faces:int,strings:array<string>,emotions:array<array<struct<Type:string,Confidence:float>>>,labels:array<string>,gps:struct<Latitude:float,Longitude:float,Altitude:float>,timestamp:timestamp,bucket:string,key:string,mediabucket:string,mediakey:string>"
    },
    {
      name = "imagemeta"
      type = "string"
    },
    {
      name = "faces"
      type = "array<struct<BoundingBox:struct<Width:float,Height:float,Left:float,Top:float>,AgeRange:struct<High:int,Low:int>,Smile:struct<Value:boolean,Confidence:float>,Eyeglasses:struct<Value:boolean,Confidence:float>,Sunglasses:struct<Value:boolean,Confidence:float>,Beard:struct<Value:boolean,Confidence:float>,Mustache:struct<Value:boolean,Confidence:float>,EyesOpen:struct<Value:boolean,Confidence:float>,MouthOpen:struct<Value:boolean,Confidence:float>,Emotions:array<struct<Type:string,Confidence:float>>,Landmarks:array<struct<Type:string,X:float,Y:float>>,Pose:struct<Roll:float,Yaw:float,Pitch:float>,Quality:struct<Brightness:float,Sharpness:float>,Confidence:float>>"
    },
    {
      name = "labels"
      type = "array<struct<Name:string,Confidence:float,Instances:array<struct<BoundingBox:struct<Width:float,Height:float,Left:float,Top:float>,Confidence:float>>,Parents:array<struct<Name:string>>>>"
    },
    {
      name = "text"
      type = "array<struct<DetectedText:string,Type:string,Id:string,ParentId:string,Confidence:float,Geometry:struct<BoundingBox:struct<Width:float,Height:float,Left:float,Top:float>,Polygon:array<struct<X:float,Y:float>>>>>"
    }
  ]
}
