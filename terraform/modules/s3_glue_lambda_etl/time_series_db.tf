module "cloudformation_logs_glue_table" {
  source = "../standard_glue_table"
  table_name          = "${var.name_stem}_partitioned_gz"
  metadata_bucket_name = "${replace(var.name_stem, "_", ".")}.metadata"
  db_name = var.db.name
  skip_header_line_count = var.skip_header_line_count
  ser_de_info = var.ser_de_info
  partition_keys = var.partition_keys
  columns = var.columns
}
