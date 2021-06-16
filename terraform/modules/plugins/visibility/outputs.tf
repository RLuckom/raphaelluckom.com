output additional_connect_sources_required {
  value = [
    "https://s3.amazonaws.com", 
    "https://${var.cost_report_summary_location.bucket}.s3.amazonaws.com", 
    "https://athena.us-east-1.amazonaws.com",
    "https://${var.plugin_config.bucket_name}.s3.amazonaws.com"
  ]
}
