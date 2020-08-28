
resource "aws_s3_bucket" "athena_bucket" {
  bucket = var.athena_bucket_name

  tags = {
    Name        = "athena"
  }
}

resource "aws_s3_bucket" "partition_bucket" {
  bucket = var.partitioned_bucket_name

  tags = {
    Name        = "partitioned"
  }
}

module "site_logs_etl" {
  source = "./modules/s3_glue_lambda_etl"
  name_stem = "log-rotation-${var.domain_name_prefix}"
  lambda_code_bucket = aws_s3_bucket.lambda_bucket.id
  lambda_code_key = "log-rotator/log-rotator.zip"
  timeout_secs = 40
  mem_mb = 256
  input_bucket = module.static_site.logging_bucket_id
  input_bucket_arn = module.static_site.logging_bucket_arn
  partition_bucket = aws_s3_bucket.partition_bucket.id
  partition_bucket_arn = aws_s3_bucket.partition_bucket.arn
  partition_prefix = "${var.partition_prefix}/${var.domain_name}"
  athena_region = var.athena_region
  athena_result_bucket = aws_s3_bucket.athena_bucket.id
  athena_result_bucket_arn = aws_s3_bucket.athena_bucket.arn
  skip_header_line_count = 2
  time_series_db_name = var.time_series_db_name
  time_series_table_name          = "${var.domain_name_prefix}_cf_logs_partitioned_gz"
  ser_de_info = {
    name                  = "${var.domain_name_prefix}_cf_logs"
    serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
    parameters = {
      "field.delim"="\t"
      "serialization.format"="\t"
    }
  }

  columns = [
    {
      name = "date"
      type = "date"
    },
    {
      name = "time"
      type = "string"
    },
    {
      name = "location"
      type = "string"
    },
    {
      name = "bytes"
      type = "bigint"
    },
    {
      name = "requestip"
      type = "string"
    },
    {
      name = "method"
      type = "string"
    },
    {
      name = "host"
      type = "string"
    },
    {
      name = "uri"
      type = "string"
    },
    {
      name = "status"
      type = "int"
    },
    {
      name = "referrer"
      type = "string"
    },
    {
      name = "useragent"
      type = "string"
    },
    {
      name = "querystring"
      type = "string"
    },
    {
      name = "cookie"
      type = "string"
    },
    {
      name = "resulttype"
      type = "string"
    },
    {
      name = "requestid"
      type = "string"
    },
    {
      name = "hostheader"
      type = "string"
    },
    {
      name = "requestprotocol"
      type = "string"
    },
    {
      name = "requestbytes"
      type = "bigint"
    },
    {
      name = "timetaken"
      type = "float"
    },
    {
      name = "xforwardedfor"
      type = "string"
    },
    {
      name = "sslprotocol"
      type = "string"
    },
    {
      name = "sslcipher"
      type = "string"
    },
    {
      name = "responseresulttype"
      type = "string"
    },
    {
      name = "httpversion"
      type = "string"
    },
    {
      name = "filestatus"
      type = "string"
    },
    {
      name = "encryptedfields"
      type = "int"
    },
    {
      name = "port"
      type = "int"
    },
    {
      name = "ttfb"
      type = "float"
    },
    {
      name = "detailedresulttype"
      type = "string"
    },
    {
      name = "contenttype"
      type = "string"
    },
    {
      name = "contentlength"
      type = "bigint"
    },
    {
      name = "rangestart"
      type = "bigint"
    },
    {
      name = "rangeend"
      type = "bigint"
    }
  ]
}
