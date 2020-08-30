resource "aws_glue_catalog_database" "time_series_database" {
  name = var.time_series_db_name == "" ? "${var.name_stem}_timeseries" : var.time_series_db_name
}

resource "aws_glue_catalog_table" "cloudformation_logs_glue_table" {
  name          = var.time_series_table_name == "" ? "${var.name_stem}_partitioned_gz" : var.time_series_table_name
  database_name = aws_glue_catalog_database.time_series_database.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL              = "TRUE"
    "skip.header.line.count"=var.skip_header_line_count
  }

	dynamic "partition_keys" {
		for_each = var.partition_keys
		content {
			name = partition_keys.value["name"]
			type = partition_keys.value["type"]
		}
	}

  storage_descriptor {
    input_format = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"
    location = "s3://${var.use_partition_bucket ? var.partition_bucket == "" ? aws_s3_bucket.partition_bucket[0].id : var.partition_bucket : var.metadata_bucket == "" ? aws_s3_bucket.metadata_bucket[0].id : var.metadata_bucket}/${var.partition_prefix}"
    compressed = true

    ser_de_info  {
     name =  var.ser_de_info.name
     serialization_library = var.ser_de_info.serialization_library
     parameters = var.ser_de_info.parameters
   }

    dynamic "columns" {
      for_each = var.columns
      content {
        name = columns.value["name"]
        type = columns.value["type"]
      }
    }

  }
}
