output plugin_relative_lambda_notifications {
  value = [{
    lambda_arn = module.process_image_uploads.lambda_notification_config.lambda_arn
    lambda_name = module.process_image_uploads.lambda_notification_config.lambda_name
    lambda_role_arn = module.process_image_uploads.lambda_notification_config.lambda_role_arn
    events = module.process_image_uploads.lambda_notification_config.events
    plugin_relative_filter_prefix = "/img/"
    filter_suffix = module.process_image_uploads.lambda_notification_config.filter_suffix
    permission_type = module.process_image_uploads.lambda_notification_config.permission_type
  }]
}

output plugin_relative_bucket_host_permissions_needed {
  value = [{
    permission_type = "put_object"
    plugin_relative_key = "/img/"
    role_arn = module.process_image_uploads.lambda_role.arn
  }]
}

output plugin_relative_bucket_upload_permissions_needed {
  value = [{
    permission_type = "put_object"
    plugin_relative_key = "/img/"
    role_arn = null
  }]
}

output static_config {
  value = {
    role_name_stem = "blog"
    slug = "blog"
  }
}

output lambda_logging_arns {
  value = [module.process_image_uploads.lambda_role.arn]
}
