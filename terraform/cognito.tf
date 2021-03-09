locals {
  variables = {
    source = "test"
    source_instance = "test"
    component = "test"
    log_level = "ERROR"
    user_group_name         = "home_user_group"
    user_email = "raph.aelluckom@gmail.com"
    aws_credentials_file = "/.aws/credentials"
    cognito_system_id = {
      security_scope = "test"
      subsystem_name = "cognito"
    }
    protected_domain_routing = {
      domain_parts = {
        top_level_domain = "com"
        controlled_domain_part = "testcog.raphaelluckom"
      }
      route53_zone_name = "raphaelluckom.com"
    }
  }
}

locals {
  protected_site_domain = "${local.variables.protected_domain_routing.domain_parts.controlled_domain_part}.${local.variables.protected_domain_routing.domain_parts.top_level_domain}"
  bucket_domain_parts = local.variables.protected_domain_routing.domain_parts
  cognito_domain = "auth.${local.protected_site_domain}"
  callback_urls = [
    "https://${local.protected_site_domain}/parseauth"
  ]
  logout_urls = [
    "https://${local.protected_site_domain}/"
  ]
  allowed_oauth_scopes = ["phone", "email", "profile", "openid", "aws.cognito.signin.user.admin"]
  allowed_oauth_flows_user_pool_client = true
  cloudfront_origins = {
    protected_site = {
      domain_name = local.protected_site_domain
      origin_id = "protected_site"
      s3_origin_config = {
        origin_access_identity = aws_cloudfront_origin_access_identity.protected_distribution_oai.cloudfront_access_identity_path
      }
    }
    dummy = {
      domain_name = "will-never-be-reached.org"
      origin_id = "dummy"
      custom_origin_config = {
        origin_protocol_policy = "match-viewer"
      }
    }
  }
  cloudfront_cache_behaviors = {
    parse_auth = {
      pattern = "/parseauth"
      compress = true
      forwarded_values = {
        querystring = true
      }
      lambda_function_associations = [{
        event_type = "viewer-request"
        lambda_function_association = module.parse_auth.lambda.arn
      }]
      target_origin = "dummy"
      viewer_protocol_policy = "redirect-to-https"
    }
    refresh_auth = {
      pattern = "/refreshauth"
      compress = true
      forwarded_values = {
        querystring = true
      }
      lambda_function_associations = [{
        event_type = "viewer-request"
        lambda_function_association = module.refresh_auth.lambda.arn
      }]
      target_origin = "dummy"
      viewer_protocol_policy = "redirect-to-https"
    }
    sign_out = {
      pattern = "/signout"
      compress = true
      forwarded_values = {
        querystring = true
      }
      lambda_function_associations = [{
        event_type = "viewer-request"
        lambda_function_association = module.sign_out.lambda.arn
      }]
      target_origin = "dummy"
      viewer_protocol_policy = "redirect-to-https"
    }
    default = {
      compress = true
      forwarded_values = {
        querystring = true
      }
      lambda_function_associations = [
        {
          event_type = "viewer-request"
          lambda_function_association = module.check_auth.lambda.arn
        },
        {
          event_type = "origin-response"
          lambda_function_association = module.http_headers.lambda.arn
        }
      ]
      target_origin = "protected_site"
      viewer_protocol_policy = "redirect-to-https"
    }
  }
}

module protected_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/website_bucket"
  domain_parts = local.variables.protected_domain_routing.domain_parts
  website_access_principals = [{
    type = "AWS",
    identifiers = [aws_cloudfront_origin_access_identity.protected_distribution_oai.iam_arn]
  }]
}

data aws_route53_zone selected {
  name         = local.variables.protected_domain_routing.route53_zone_name
  private_zone = false
}

resource "aws_s3_bucket_object" "index" {
  bucket = module.protected_bucket.bucket.id
  key    = "index.html"
  content_type = "text/html"
  content = <<EOF
<html>
<body>
<div> hello world </div>
</body>
</html>
EOF
  depends_on = [module.protected_bucket]
}

module cognito_fn_template {
  source = "github.com/RLuckom/terraform_modules//protocols/boundary_oauth"
  token_issuer = "https://${module.cognito_user_management.user_pool.endpoint}"
  client_id = module.cognito_user_management.user_pool_client.id
  client_secret = module.cognito_user_management.user_pool_client.client_secret
  nonce_signing_secret = random_password.nonce_signing_secret.result
  auth_domain = "https://${local.cognito_domain}"
  user_group_name = local.variables.user_group_name
  log_source = local.variables.source
  log_source_instance = local.variables.source_instance
  component = local.variables.component
}

module cognito_user_management {
  source = "github.com/RLuckom/terraform_modules//aws/state/user_mgmt/stele"
  system_id = local.variables.cognito_system_id
  protected_domain_routing = local.variables.protected_domain_routing
  aws_credentials_file = local.variables.aws_credentials_file
  user_group_name = local.variables.user_group_name
  user_email = local.variables.user_email
}

module check_auth {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  publish = true
  timeout_secs = module.cognito_fn_template.function_configs.function_defaults.timeout_secs
  mem_mb = module.cognito_fn_template.function_configs.function_defaults.mem_mb
  role_service_principal_ids = module.cognito_fn_template.function_configs.function_defaults.role_service_principal_ids
  source_contents = module.cognito_fn_template.function_configs.check_auth.source_contents
  lambda_details = {
    action_name = module.cognito_fn_template.function_configs.check_auth.details.action_name
    scope_name = local.variables.cognito_system_id.security_scope
    policy_statements = []
  }
  local_source_directory = module.cognito_fn_template.directory
}

module http_headers {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  publish = true
  timeout_secs = module.cognito_fn_template.function_configs.function_defaults.timeout_secs
  mem_mb = module.cognito_fn_template.function_configs.function_defaults.mem_mb
  role_service_principal_ids = module.cognito_fn_template.function_configs.function_defaults.role_service_principal_ids
  source_contents = module.cognito_fn_template.function_configs.http_headers.source_contents
  lambda_details = {
    action_name = module.cognito_fn_template.function_configs.http_headers.details.action_name
    scope_name = local.variables.cognito_system_id.security_scope
    policy_statements = []
  }
  local_source_directory = module.cognito_fn_template.directory
}

module sign_out {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  publish = true
  timeout_secs = module.cognito_fn_template.function_configs.function_defaults.timeout_secs
  mem_mb = module.cognito_fn_template.function_configs.function_defaults.mem_mb
  role_service_principal_ids = module.cognito_fn_template.function_configs.function_defaults.role_service_principal_ids
  source_contents = module.cognito_fn_template.function_configs.sign_out.source_contents
  lambda_details = {
    action_name = module.cognito_fn_template.function_configs.sign_out.details.action_name
    scope_name = local.variables.cognito_system_id.security_scope
    policy_statements = []
  }
  local_source_directory = module.cognito_fn_template.directory
}

module refresh_auth {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  publish = true
  timeout_secs = module.cognito_fn_template.function_configs.function_defaults.timeout_secs
  mem_mb = module.cognito_fn_template.function_configs.function_defaults.mem_mb
  role_service_principal_ids = module.cognito_fn_template.function_configs.function_defaults.role_service_principal_ids
  source_contents = module.cognito_fn_template.function_configs.refresh_auth.source_contents
  lambda_details = {
    action_name = module.cognito_fn_template.function_configs.refresh_auth.details.action_name
    scope_name = local.variables.cognito_system_id.security_scope
    policy_statements = []
  }
  local_source_directory = module.cognito_fn_template.directory
}

module parse_auth {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  publish = true
  timeout_secs = module.cognito_fn_template.function_configs.function_defaults.timeout_secs
  mem_mb = module.cognito_fn_template.function_configs.function_defaults.mem_mb
  role_service_principal_ids = module.cognito_fn_template.function_configs.function_defaults.role_service_principal_ids
  source_contents = module.cognito_fn_template.function_configs.parse_auth.source_contents
  lambda_details = {
    action_name = module.cognito_fn_template.function_configs.parse_auth.details.action_name
    scope_name = local.variables.cognito_system_id.security_scope
    policy_statements = []
  }
  local_source_directory = module.cognito_fn_template.directory
}

resource aws_cloudfront_origin_access_identity protected_distribution_oai {
}

resource random_password nonce_signing_secret {
  length = 16
  override_special = "-._~"
}

resource aws_route53_record cert_validation_private_site {
  name            = aws_acm_certificate.cert_private_site.domain_validation_options.*.resource_record_name[0]
  records         = aws_acm_certificate.cert_private_site.domain_validation_options.*.resource_record_value
  type            = aws_acm_certificate.cert_private_site.domain_validation_options.*.resource_record_type[0]
  zone_id         = data.aws_route53_zone.selected.zone_id
  ttl             = 60
}

resource aws_route53_record auth_a_record_private_site {
  name    = local.protected_site_domain
  type    = "A"
  zone_id = data.aws_route53_zone.selected.id
  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.private_site_distribution.domain_name
    # This zone_id is fixed
    zone_id = "Z2FDTNDATAQYW2"
  }
}

resource aws_acm_certificate cert_private_site {
  domain_name    = local.protected_site_domain
  subject_alternative_names = []
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource aws_acm_certificate_validation cert_validation_private_site {
  certificate_arn = aws_acm_certificate.cert_private_site.arn
  validation_record_fqdns = [aws_route53_record.cert_validation_private_site.fqdn]
}

resource aws_cloudfront_distribution private_site_distribution {

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class = "PriceClass_100"

  aliases = [local.protected_site_domain]
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.cert_private_site.arn
    minimum_protocol_version = "TLSv1"
    ssl_support_method = "sni-only"
  }

  origin {
    domain_name = module.protected_bucket.bucket.bucket_regional_domain_name
    origin_id   = local.cloudfront_origins.protected_site.origin_id

    s3_origin_config {
      origin_access_identity = local.cloudfront_origins.protected_site.s3_origin_config.origin_access_identity
    }
  }

  origin {
    domain_name = local.cloudfront_origins.dummy.domain_name
    origin_id   = local.cloudfront_origins.dummy.origin_id

    custom_origin_config {
      http_port = 80
      https_port = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols = [ "TLSv1.2" ]
    }
  }


  logging_config {
    include_cookies = true
    bucket          = "${module.visibility_system.serverless_site_configs["cognito"].cloudfront_log_delivery_bucket}.s3.amazonaws.com"
    prefix          =  module.visibility_system.serverless_site_configs["cognito"].cloudfront_log_delivery_prefix
  }

  ordered_cache_behavior {
    path_pattern = local.cloudfront_cache_behaviors.sign_out.pattern
    target_origin_id = local.cloudfront_cache_behaviors.sign_out.target_origin
    allowed_methods = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    cached_methods = ["HEAD", "GET"]
    compress = true
    default_ttl = 0
    min_ttl = 0
    max_ttl = 0
    forwarded_values {
      query_string = true

      cookies {
        forward = "all"
      }
    }
    viewer_protocol_policy = "redirect-to-https"
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = module.sign_out.lambda.qualified_arn
      include_body = false
    }
  }

  ordered_cache_behavior {
    path_pattern = local.cloudfront_cache_behaviors.refresh_auth.pattern
    target_origin_id = local.cloudfront_cache_behaviors.refresh_auth.target_origin
    allowed_methods = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    cached_methods = ["HEAD", "GET"]
    compress = true
    default_ttl = 0
    min_ttl = 0
    max_ttl = 0
    forwarded_values {
      query_string = true

      cookies {
        forward = "all"
      }
    }
    viewer_protocol_policy = "redirect-to-https"
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = module.refresh_auth.lambda.qualified_arn
      include_body = false
    }
  }

  ordered_cache_behavior {
    path_pattern = local.cloudfront_cache_behaviors.parse_auth.pattern
    target_origin_id = local.cloudfront_cache_behaviors.parse_auth.target_origin
    allowed_methods = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    cached_methods = ["HEAD", "GET"]
    compress = true
    default_ttl = 0
    min_ttl = 0
    max_ttl = 0
    forwarded_values {
      query_string = true

      cookies {
        forward = "all"
      }
    }
    viewer_protocol_policy = "redirect-to-https"
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = module.parse_auth.lambda.qualified_arn
      include_body = false
    }
  }

  default_cache_behavior {
    allowed_methods = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    cached_methods = ["HEAD", "GET"]
    target_origin_id = "protected_site"
    compress = true
    default_ttl = 0
    min_ttl = 0
    max_ttl = 0

    forwarded_values {
      query_string = true

      cookies {
        forward = "none"
      }
    }
    viewer_protocol_policy = "redirect-to-https"
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = module.check_auth.lambda.qualified_arn
      include_body = false
    }
    lambda_function_association {
      event_type   = "origin-response"
      lambda_arn   = module.http_headers.lambda.qualified_arn
      include_body = false
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
