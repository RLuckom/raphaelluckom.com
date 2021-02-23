locals {
  variables = {
    zone = "raphaelluckom.com"
    user_email = "raph.aelluckom@gmail.com"
    aws_credentials_file = "/.aws/credentials"
    cognito_system_id = {
      security_scope = "test"
      subsystem_name = "cognito"
    }
    protected_domain_parts = {
      top_level_domain = "com"
      controlled_domain_part = "testcog.raphaelluckom"
    }
  }
}

locals {
  user_group_name         = "home_user_group"
  protected_site_domain = "${local.variables.protected_domain_parts.controlled_domain_part}.${local.variables.protected_domain_parts.top_level_domain}"
  bucket_domain_parts = {
    top_level_domain = "com"
    controlled_domain_part = "testcog.raphaelluckom"
  }
  cognito_domain = "auth.${local.protected_site_domain}"
  callback_urls = [
    "https://${local.protected_site_domain}/parseauth"
  ]
  logout_urls = [
    "https://${local.protected_site_domain}/"
  ]
  allowed_oauth_scopes = ["phone", "email", "profile", "openid", "aws.cognito.signin.user.admin"]
  allowed_oauth_flows_user_pool_client = true
  http_header_values = {
    "Content-Security-Policy" = "default-src 'none'; img-src 'self'; script-src 'self' https://code.jquery.com https://stackpath.bootstrapcdn.com; style-src 'self' 'unsafe-inline' https://stackpath.bootstrapcdn.com; object-src 'none'; connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com"
    "Strict-Transport-Security" = "max-age=31536000; includeSubdomains; preload"
    "Referrer-Policy" = "same-origin"
    "X-XSS-Protection" = "1; mode=block"
    "X-Frame-Options" = "DENY"
    "X-Content-Type-Options" = "nosniff"
  }
  set_headers_config = {
    httpHeaders = local.http_header_values
    logLevel = "DEBUG"
  }
  cognito_lambda_config = {
    source = "test"
    sourceInstance = "test"
    component = "test"
    tokenIssuer = "https://${aws_cognito_user_pool.user_pool.endpoint}"
    tokenJwksUri = "https://${aws_cognito_user_pool.user_pool.endpoint}/.well-known/jwks.json"
    userPoolArn = aws_cognito_user_pool.user_pool.arn
    clientId = aws_cognito_user_pool_client.client.id
    clientSecret = aws_cognito_user_pool_client.client.client_secret
    oauthScopes = ["phone", "email", "profile", "openid", "aws.cognito.signin.user.admin"]
    cognitoAuthDomain = local.cognito_domain
    redirectPathSignIn = "/parseauth"
    redirectPathSignOut = "/"
    redirectPathAuthRefresh = "/refreshauth"
    cookieSettings = {
      idToken = null
      accessToken = null
      refreshToken = null
      nonce = null
    }
    mode = "StaticSiteMode"
    httpHeaders = local.http_header_values
    logLevel = "DEBUG"
    nonceSigningSecret = random_password.nonce_signing_secret.result
    additionalCookies = {}
    requiredGroup = local.user_group_name
  }
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
  function_defaults = {
    mem_mb = 128
    timeout_secs = 3
    shared_source = [
      {
        file_name = "shared/shared.js"
        file_contents = file("./functions/libraries/src/cognito_functions/shared/shared.js")
      },
      {
        file_name = "shared/validate_jwt.js"
        file_contents = file("./functions/libraries/src/cognito_functions/shared/validate_jwt.js")
      },
      {
        file_name = "shared/error_page/template.html"
        file_contents = file("./functions/libraries/src/cognito_functions/shared/error_page/template.html")
      }
    ]
    role_service_principal_ids = ["edgelambda.amazonaws.com", "lambda.amazonaws.com"]
    policy_statements = []
  }
  http_headers = {
    source_contents = [
      {
        file_name = "index.js"
        file_contents = file("./functions/libraries/src/cognito_functions/http_headers.js")
      },
      {
        file_name = "config.json"
        file_contents = jsonencode(local.set_headers_config)
      }
    ]
    details = {
      action_name = "http_headers"
      scope_name = local.variables.cognito_system_id.security_scope
      policy_statements = local.function_defaults.policy_statements
    }
  }
  check_auth = {
    source_contents = [
      {
        file_name = "index.js"
        file_contents = file("./functions/libraries/src/cognito_functions/check_auth.js")
      },
      {
        file_name = "config.json"
        file_contents = jsonencode(local.cognito_lambda_config)
      }
    ]
    details = {
      action_name = "check_auth"
      scope_name = local.variables.cognito_system_id.security_scope
      policy_statements = local.function_defaults.policy_statements
    }
  }
  sign_out = {
    source_contents = [
      {
        file_name = "index.js"
        file_contents = file("./functions/libraries/src/cognito_functions/sign_out.js")
      },
      {
        file_name = "config.json"
        file_contents = jsonencode(local.cognito_lambda_config)
      }
    ]
    details = {
      action_name = "sign_out"
      scope_name = local.variables.cognito_system_id.security_scope
      policy_statements = local.function_defaults.policy_statements
    }
  }
  refresh_auth = {
    source_contents = [
      {
        file_name = "index.js"
        file_contents = file("./functions/libraries/src/cognito_functions/refresh_auth.js")
      },
      {
        file_name = "config.json"
        file_contents = jsonencode(local.cognito_lambda_config)
      }
    ]
    details = {
      action_name = "refresh_auth"
      scope_name = local.variables.cognito_system_id.security_scope
      policy_statements = local.function_defaults.policy_statements
    }
  }
  parse_auth = {
    source_contents = [
      {
        file_name = "index.js"
        file_contents = file("./functions/libraries/src/cognito_functions/parse_auth.js")
      },
      {
        file_name = "config.json"
        file_contents = jsonencode(local.cognito_lambda_config)
      }
    ]
    details = {
      action_name = "parse_auth"
      scope_name = local.variables.cognito_system_id.security_scope
      policy_statements = local.function_defaults.policy_statements
    }
  }
}

module cognito_fn_template {
  source = "github.com/RLuckom/terraform_modules//aws/layers/static/cognito_utils?ref=lambda-env-vars"
}

module protected_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/website_bucket"
  domain_parts = local.variables.protected_domain_parts
  website_access_principals = [{
    type = "AWS",
    identifiers = [aws_cloudfront_origin_access_identity.protected_distribution_oai.iam_arn]
  }]
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

module check_auth {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda?ref=lambda-env-vars"
  publish = true
  timeout_secs = local.function_defaults.timeout_secs
  mem_mb = local.function_defaults.mem_mb
  role_service_principal_ids = local.function_defaults.role_service_principal_ids
  source_contents = concat(
    local.function_defaults.shared_source,
    local.check_auth.source_contents
  )
  lambda_details = local.check_auth.details
  local_source_directory = module.cognito_fn_template.directory
}

module http_headers {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda?ref=lambda-env-vars"
  publish = true
  timeout_secs = local.function_defaults.timeout_secs
  mem_mb = local.function_defaults.mem_mb
  role_service_principal_ids = local.function_defaults.role_service_principal_ids
  source_contents = concat(
    local.function_defaults.shared_source,
    local.http_headers.source_contents
  )
  lambda_details = local.http_headers.details
  local_source_directory = module.cognito_fn_template.directory
}

module sign_out {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda?ref=lambda-env-vars"
  publish = true
  timeout_secs = local.function_defaults.timeout_secs
  mem_mb = local.function_defaults.mem_mb
  role_service_principal_ids = local.function_defaults.role_service_principal_ids
  source_contents = concat(
    local.function_defaults.shared_source,
    local.sign_out.source_contents
  )
  lambda_details = local.sign_out.details
  local_source_directory = module.cognito_fn_template.directory
}

module refresh_auth {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda?ref=lambda-env-vars"
  publish = true
  timeout_secs = local.function_defaults.timeout_secs
  mem_mb = local.function_defaults.mem_mb
  role_service_principal_ids = local.function_defaults.role_service_principal_ids
  source_contents = concat(
    local.function_defaults.shared_source,
    local.refresh_auth.source_contents
  )
  lambda_details = local.refresh_auth.details
  local_source_directory = module.cognito_fn_template.directory
}

module parse_auth {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda?ref=lambda-env-vars"
  publish = true
  timeout_secs = local.function_defaults.timeout_secs
  mem_mb = local.function_defaults.mem_mb
  role_service_principal_ids = local.function_defaults.role_service_principal_ids
  source_contents = concat(
    local.function_defaults.shared_source,
    local.parse_auth.source_contents
  )
  lambda_details = local.parse_auth.details
  local_source_directory = module.cognito_fn_template.directory
}

resource aws_cloudfront_origin_access_identity protected_distribution_oai {
}

resource random_password nonce_signing_secret {
  length = 16
  override_special = "-._~"
}

resource aws_cognito_user_pool user_pool {
  name = "${local.variables.cognito_system_id.security_scope}-${local.variables.cognito_system_id.subsystem_name}-pool"

  schema {
    name                     = "email"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = false 
    required                 = true 
    string_attribute_constraints {
      min_length = 3
      max_length = 250
    }
  }
  auto_verified_attributes = ["email"]
}

resource aws_cognito_user_group user_group {
  name         = local.user_group_name
  user_pool_id = aws_cognito_user_pool.user_pool.id
}

resource null_resource user {

  provisioner "local-exec" {
    # Bootstrap script called with private_ip of each node in the clutser
    command = "aws cognito-idp admin-create-user --user-pool-id ${aws_cognito_user_pool.user_pool.id} --username ${local.variables.user_email} --user-attributes Name=email,Value=${local.variables.user_email} && sleep 5 && aws cognito-idp admin-add-user-to-group --user-pool-id ${aws_cognito_user_pool.user_pool.id} --username ${local.variables.user_email} --group-name ${aws_cognito_user_group.user_group.name}"
    environment = {
      AWS_SHARED_CREDENTIALS_FILE = local.variables.aws_credentials_file
    }
  }
}

resource aws_cognito_user_pool_client client {
  name = "${local.variables.cognito_system_id.security_scope}-${local.variables.cognito_system_id.subsystem_name}-client"

  user_pool_id = aws_cognito_user_pool.user_pool.id

  allowed_oauth_flows = ["implicit", "code"]
  read_attributes = [
     "address", "birthdate", "email", "email_verified", "family_name", "gender", "given_name", "locale", "middle_name", "name", "nickname", "phone_number", "phone_number_verified", "picture", "preferred_username", "profile", "updated_at", "website", "zoneinfo"
  ]
  write_attributes = [
    "address", "birthdate", "email", "family_name", "gender", "given_name", "locale", "middle_name", "name", "nickname", "phone_number", "picture", "preferred_username", "profile", "updated_at", "website", "zoneinfo"
  ]
  supported_identity_providers = ["COGNITO"]
  generate_secret = true
  callback_urls = local.callback_urls
  logout_urls = local.logout_urls
  allowed_oauth_scopes = local.allowed_oauth_scopes
  allowed_oauth_flows_user_pool_client = local.allowed_oauth_flows_user_pool_client
}

resource aws_cognito_user_pool_domain domain {
  domain    = local.cognito_domain
  certificate_arn = aws_acm_certificate.cert.arn
  user_pool_id    = aws_cognito_user_pool.user_pool.id
  depends_on = [
    aws_route53_record.auth_a_record_private_site 
  ]
}

data aws_route53_zone selected {
  name         = local.variables.zone
  private_zone = false
}

resource aws_route53_record cert_validation {
  name            = aws_acm_certificate.cert.domain_validation_options.*.resource_record_name[0]
  records         = aws_acm_certificate.cert.domain_validation_options.*.resource_record_value
  type            = aws_acm_certificate.cert.domain_validation_options.*.resource_record_type[0]
  zone_id         = data.aws_route53_zone.selected.zone_id
  ttl             = 60
}

resource aws_route53_record auth_a_record {
  name    = local.cognito_domain
  type    = "A"
  zone_id = data.aws_route53_zone.selected.id
  alias {
    evaluate_target_health = false
    name                   = aws_cognito_user_pool_domain.domain.cloudfront_distribution_arn
    # This zone_id is fixed
    zone_id = "Z2FDTNDATAQYW2"
  }
}

resource aws_acm_certificate cert {
  domain_name    = local.cognito_domain
  subject_alternative_names = []
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource aws_acm_certificate_validation cert_validation {
  certificate_arn = aws_acm_certificate.cert.arn
  validation_record_fqdns = [aws_route53_record.cert_validation.fqdn]
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
      include_body = false // TODO true?
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
      include_body = false // TODO true?
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
      include_body = false // TODO true?
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
      include_body = false // TODO true?
    }
    lambda_function_association {
      event_type   = "origin-response"
      lambda_arn   = module.http_headers.lambda.qualified_arn
      include_body = false // TODO true?
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
