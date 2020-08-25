resource "aws_glue_catalog_database" "time_series_database" {
  name = var.time_series_db_name
}

resource "aws_glue_catalog_table" "cloudformation_logs_glue_table" {
  name          = "${var.domain_name_prefix}_cf_logs_partitioned_gz"
  database_name = var.time_series_db_name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL              = "TRUE"
    "skip.header.line.count"=2
  }

  partition_keys {
    name = "year"
    type = "string"
  }

  partition_keys {
    name = "month"
    type = "string"
  }

  partition_keys {
    name = "day"
    type = "string"
  }

  partition_keys {
    name = "hour"
    type = "string"
  }

  storage_descriptor {
    input_format = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"
    location      = "s3://${aws_s3_bucket.partition_bucket.id}/${var.partition_prefix}/${var.domain_name}"
    compressed = true

    ser_de_info {
      name                  = "${var.domain_name_prefix}_cf_logs"
      serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
      parameters = {
        "field.delim"="\t"
        "serialization.format"="\t"
      }
    }

    columns {
      name = "date"
      type = "date"
    }

    columns {
      name = "time"
      type = "string"
    }

    columns {
      name = "location"
      type = "string"
    }

    columns {
      name = "bytes"
      type = "bigint"
    }

    columns {
      name = "requestip"
      type = "string"
    }

    columns {
      name = "method"
      type = "string"
    }

    columns {
      name = "host"
      type = "string"
    }

    columns {
      name = "uri"
      type = "string"
    }

    columns {
      name = "status"
      type = "int"
    }

    columns {
      name = "referrer"
      type = "string"
    }

    columns {
      name = "useragent"
      type = "string"
    }

    columns {
      name = "querystring"
      type = "string"
    }

    columns {
      name = "cookie"
      type = "string"
    }

    columns {
      name = "resulttype"
      type = "string"
    }

    columns {
      name = "requestid"
      type = "string"
    }

    columns {
      name = "hostheader"
      type = "string"
    }

    columns {
      name = "requestprotocol"
      type = "string"
    }

    columns {
      name = "requestbytes"
      type = "bigint"
    }

    columns {
      name = "timetaken"
      type = "float"
    }

    columns {
      name = "xforwardedfor"
      type = "string"
    }

    columns {
      name = "sslprotocol"
      type = "string"
    }

    columns {
      name = "sslcipher"
      type = "string"
    }

    columns {
      name = "responseresulttype"
      type = "string"
    }

    columns {
      name = "httpversion"
      type = "string"
    }

    columns {
      name = "filestatus"
      type = "string"
    }

    columns {
      name = "encryptedfields"
      type = "int"
    }

    columns {
      name = "port"
      type = "int"
    }

    columns {
      name = "ttfb"
      type = "float"
    }

    columns {
      name = "detailedresulttype"
      type = "string"
    }

    columns {
      name = "contenttype"
      type = "string"
    }

    columns {
      name = "contentlength"
      type = "bigint"
    }

    columns {
      name = "rangestart"
      type = "bigint"
    }

    columns {
      name = "rangeend"
      type = "bigint"
    }

  }
}
