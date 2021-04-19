output human_attention_archive_config {
  value = {
    bucket = module.admin_site.website_bucket_name
    prefix = "${local.upload_root}/"
    suffix = ""
    filter_tags = {}
    completion_tags = var.archive_tags
    storage_class = var.archive_storage_class
  }
}

output website_bucket_name {
  value = module.admin_site.website_bucket_name  
}

output default_styles_path {
  value = module.admin_site_frontpage.default_styles_path
}

output plugin_authenticated_roles {
  value = zipmap(
    [for k in keys(var.plugin_configs) : replace(k, "/", "")],
    [for name in [for k in keys(var.plugin_configs) : replace(k, "/", "")]:
    module.cognito_identity_management.authenticated_role[name]
  ])
}
