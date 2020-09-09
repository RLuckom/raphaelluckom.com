resource "aws_glue_catalog_database" "time_series_db" {
  name = "rluckom_photos_timeseries"
}
module "photos_etl" {
  source = "./modules/s3_glue_lambda_etl"
  name_stem = "rluckom_photos"
  db = {
    name = aws_glue_catalog_database.time_series_db.name
    arn = aws_glue_catalog_database.time_series_db.arn
  }
  lambda_code_bucket = aws_s3_bucket.lambda_bucket.id
  lambda_code_key = "rluckom.photos/lambda.zip"
  athena_region = var.athena_region
  ser_de_info = var.json_ser_de

  statements = concat(var.athena_query_policy, var.allow_rekognition_policy)

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
