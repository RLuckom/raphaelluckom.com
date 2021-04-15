locals {
  variables = {
    user_group_name         = "home_user_group"
    user_email = "raph.aelluckom@gmail.com"
    cognito_system_id = {
      security_scope = "test"
      subsystem_name = "cognito"
    }
    admin_domain_routing = {
      domain_parts = module.visibility_system.serverless_site_configs["test_admin"].domain_parts
      route53_zone_name = "raphaelluckom.com"
    }
    test_domain_routing = {
      domain_parts = module.visibility_system.serverless_site_configs["test"].domain_parts
      route53_zone_name = "raphaelluckom.com"
    }
  }
}

module human_attention_archive {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/replicated_archive"
  providers = {
    aws.replica1 = aws.frankfurt
    aws.replica2 = aws.sydney
    aws.replica3 = aws.canada
  }
  bucket_prefix = "test-human-attention"
  security_scope = "prod"
  replication_lambda_event_configs = local.notify_failure_only
  replication_function_logging_config = module.visibility_system.lambda_log_configs["prod"]["human"].config
  donut_days_layer_config = module.donut_days.layer_config
  replication_sources = [{
    bucket = module.admin_site.website_bucket_name
    prefix = "uploads/"
    suffix = ""
    filter_tags = {}
    completion_tags = [{
      Key = "Archived"
      Value = "true"
    }]
    storage_class = "GLACIER"
  }]
}

module cognito_user_management {
  source = "github.com/RLuckom/terraform_modules//aws/state/user_mgmt/stele"
  system_id = local.variables.cognito_system_id
  protected_domain_routing = local.variables.admin_domain_routing
  additional_protected_domains = ["test.raphaelluckom.com", "www.test.raphaelluckom.com"]
  user_group_name = local.variables.user_group_name
  user_email = local.variables.user_email
}

module cognito_identity_management {
  source = "github.com/RLuckom/terraform_modules//aws/access_control/hinge"
  system_id = local.variables.cognito_system_id
  required_group = local.variables.user_group_name
  client_id               = module.cognito_user_management.user_pool_client.id
  provider_endpoint           = module.cognito_user_management.user_pool.endpoint
  authenticated_policy_statements = {
    athena = []
    blog = []
  }
  plugin_role_name_map = {
    "blog" = "blog"
    "visibility" = "athena"
  }
}

resource random_password nonce_signing_secret {
  length = 16
  override_special = "-._~"
}

module access_control_functions {
  source = "github.com/RLuckom/terraform_modules//aws/access_control/gattice"
  token_issuer = "https://${module.cognito_user_management.user_pool.endpoint}"
  client_id = module.cognito_user_management.user_pool_client.id
  security_scope = local.variables.cognito_system_id.security_scope
  client_secret = module.cognito_user_management.user_pool_client.client_secret
  nonce_signing_secret = random_password.nonce_signing_secret.result
  protected_domain_routing = local.variables.admin_domain_routing
  user_group_name = local.variables.user_group_name
  http_header_values = {
    "Content-Security-Policy" = "default-src 'none'; style-src 'self'; script-src https://admin.raphaelluckom.com/assets/js/; object-src 'none'; connect-src 'self' https://athena.us-east-1.amazonaws.com https://s3.amazonaws.com https://admin-raphaelluckom-com.s3.amazonaws.com; img-src 'self' data:;"
    "Strict-Transport-Security" = "max-age=31536000; includeSubdomains; preload"
    "Referrer-Policy" = "same-origin"
    "X-XSS-Protection" = "1; mode=block"
    "X-Frame-Options" = "DENY"
    "X-Content-Type-Options" = "nosniff"
  }
  http_header_values_by_plugin = {
    visibility = {
      "Content-Security-Policy" = "default-src 'none'; style-src 'self'; script-src https://admin.raphaelluckom.com/plugins/visibility/assets/js/; object-src 'none'; connect-src 'self' https://athena.us-east-1.amazonaws.com https://s3.amazonaws.com https://admin-raphaelluckom-com.s3.amazonaws.com; img-src 'self' data:;"
      "Strict-Transport-Security" = "max-age=31536000; includeSubdomains; preload"
      "Referrer-Policy" = "same-origin"
      "X-XSS-Protection" = "1; mode=block"
      "X-Frame-Options" = "DENY"
      "X-Content-Type-Options" = "nosniff"
    }
    blog = {
      "Content-Security-Policy" = "default-src 'none'; style-src 'self'; script-src https://admin.raphaelluckom.com/plugins/blog/assets/js/; object-src 'none'; connect-src 'self' https://athena.us-east-1.amazonaws.com https://s3.amazonaws.com https://admin-raphaelluckom-com.s3.amazonaws.com; img-src 'self' data:;"
      "Strict-Transport-Security" = "max-age=31536000; includeSubdomains; preload"
      "Referrer-Policy" = "same-origin"
      "X-XSS-Protection" = "1; mode=block"
      "X-Frame-Options" = "DENY"
      "X-Content-Type-Options" = "nosniff"
    }
  }
}

module get_access_creds {
  source = "github.com/RLuckom/terraform_modules//aws/access_control/cognito_to_aws_creds"
  identity_pool_id = module.cognito_identity_management.identity_pool.id
  user_pool_endpoint = module.cognito_user_management.user_pool.endpoint
  api_path = "/api/actions/access/credentials"
  gateway_name_stem = "test_site"
  client_id = module.cognito_user_management.user_pool_client.id
  aws_sdk_layer = module.aws_sdk.layer_config
  plugin_role_map = module.cognito_identity_management.plugin_role_map
}

module admin_site_frontpage {
  source = "./modules/admin_site_ui"
  plugin_configs = [
    module.admin_site_blog_plugin.plugin_config,
    module.admin_site_visibility_plugin.plugin_config
  ]
}

module admin_site_blog_plugin {
  source = "./modules/plugins/blog"
  default_styles_path = module.admin_site_frontpage.default_styles_path
}

module admin_site_visibility_plugin {
  source = "./modules/plugins/visibility"
  default_styles_path = module.admin_site_frontpage.default_styles_path
}

module admin_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/capstan"
  system_id = {
    security_scope = "test"
    subsystem_name = "test"
  }
  file_configs = concat(
    module.admin_site_frontpage.files,
    module.admin_site_blog_plugin.files,
    module.admin_site_visibility_plugin.files
  )
  lambda_authorizers = module.get_access_creds.lambda_authorizer_config
  forbidden_website_paths = ["uploads/"]
  lambda_origins = module.get_access_creds.lambda_origins
  routing = local.variables.admin_domain_routing
  website_bucket_prefix_object_permissions = concat(
    [{
      permission_type = "put_object"
      prefix = "uploads/img/"
      arns = [module.cognito_identity_management.authenticated_role["blog"].arn]
    }],
    [{
      permission_type = "put_object"
      prefix = "img/"
      arns = [module.upload_img.role.arn]
    }],
    module.human_attention_archive.replication_function_permissions_needed[module.admin_site.website_bucket_name]
  )
  website_bucket_lambda_notifications = concat(
    [{
      lambda_arn = module.upload_img.lambda.arn
      lambda_name = module.upload_img.lambda.function_name
      lambda_role_arn = module.upload_img.role.arn
      permission_type     = "read_and_tag_known"
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = "uploads/"
      filter_suffix       = ""
    }],
    module.human_attention_archive.bucket_notifications[module.admin_site.website_bucket_name]
  )

  website_bucket_cors_rules = [{
    allowed_headers = ["authorization", "content-type", "x-amz-content-sha256", "x-amz-date", "x-amz-security-token", "x-amz-user-agent"]
    allowed_methods = ["PUT", "GET"]
    allowed_origins = ["https://admin.raphaelluckom.com"]
    expose_headers = ["ETag"]
    max_age_seconds = 3000
  }]
  access_control_function_qualified_arns = [module.access_control_functions.access_control_function_qualified_arns]
  coordinator_data = module.visibility_system.serverless_site_configs["test_admin"]
  subject_alternative_names = ["www.admin.raphaelluckom.com"]
}

module test_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/tetrapod"
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.prod_site_title
  coordinator_data = module.visibility_system.serverless_site_configs["test"]
  system_id = {
    security_scope = "test"
    subsystem_name = "site"
  }
  website_bucket_bucket_permissions = [
    {
      permission_type = "list_bucket"
      arns = [module.cognito_identity_management.authenticated_role["blog"].arn]
    }
  ]
  routing = {
    domain_parts = module.visibility_system.serverless_site_configs["test"].domain_parts
    route53_zone_name = var.route53_zone_name
  }
  subject_alternative_names = ["www.test.raphaelluckom.com"]
  lambda_event_configs = local.notify_failure_only
  layers = {
    donut_days = module.donut_days.layer_config
    markdown_tools = module.markdown_tools.layer_config
  }
}

module upload_img {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  timeout_secs = 10
  mem_mb = 512
  logging_config = module.visibility_system.lambda_log_configs["prod"]["human"].config
  log_level = true
  config_contents = templatefile("./functions/configs/publishWebImage.js", {
    media_hosting_bucket = module.admin_site.website_bucket_name
    media_storage_prefix = "img/"
    tags = jsonencode([{
      Key = "imagePublished"
      Value = "true"
    }])
  })
  lambda_event_configs = local.notify_failure_only
  action_name = "upload_img"
  scope_name = module.visibility_system.lambda_log_configs["prod"]["human"].security_scope
  donut_days_layer = module.donut_days.layer_config
  additional_layers = [
    module.image_dependencies.layer_config
  ]
}
