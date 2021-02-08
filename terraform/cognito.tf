locals {
  cognito_domain = "auth.test.${local.zone}"
  cognito_system_id = {
    security_scope = "test"
    subsystem_name = "cognito"
  }
  callback_urls = [
    "https://test.raphaelluckom.com/index.html"
  ]
  logout_urls = [
    "https://test.raphaelluckom.com/index.html"
  ]
  allowed_oauth_scopes = [
    "aws.cognito.signin.user.admin","openid"
  ]
  allowed_oauth_flows_user_pool_client = true
  zone = "raphaelluckom.com"
  login_index_html = templatefile(
    "./cognito_assets/login_page/index.html",
    {
      client_id = aws_cognito_user_pool.user_pool.id
      aws_region = "us-east-1"
      base_domain = local.cognito_domain
    }
  )
  cognito_lambda_config = {
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
    httpHeaders = {
      "Content-Security-Policy" = "default-src 'none'; img-src 'self'; script-src 'self' https://code.jquery.com https://stackpath.bootstrapcdn.com; style-src 'self' 'unsafe-inline' https://stackpath.bootstrapcdn.com; object-src 'none'; connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com"
      "Strict-Transport-Security" = "max-age=31536000; includeSubdomains; preload"
      "Referrer-Policy" = "same-origin"
      "X-XSS-Protection" = "1; mode=block"
      "X-Frame-Options" = "DENY"
      "X-Content-Type-Options" = "nosniff"
    }
    logLevel = "debug"
    nonceSigningSecret = random_password.nonce_signing_secret.result
    cookieCompatibility = "elasticsearch"
    additionalCookies = {}
    requiredGroup = aws_cognito_user_pool.user_pool.name
  }
}

resource random_password nonce_signing_secret {
  length = 16
  override_special = "-._~"
}

resource aws_cognito_user_pool user_pool {
  name = "${local.cognito_system_id.security_scope}-${local.cognito_system_id.subsystem_name}-pool"

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

resource aws_cognito_user_pool_client client {
  name = "${local.cognito_system_id.security_scope}-${local.cognito_system_id.subsystem_name}-client"

  user_pool_id = aws_cognito_user_pool.user_pool.id

  allowed_oauth_flows = ["implicit", "code"]
  read_attributes = [
     "address", "birthdate", "email", "email_verified", "family_name", "gender", "given_name", "locale", "middle_name", "name", "nickname", "phone_number", "phone_number_verified", "picture", "preferred_username", "profile", "updated_at", "website", "zoneinfo"
  ]
  write_attributes = [
    "address", "birthdate", "email", "family_name", "gender", "given_name", "locale", "middle_name", "name", "nickname", "phone_number", "picture", "preferred_username", "profile", "updated_at", "website", "zoneinfo"
  ]
  supported_identity_providers = ["COGNITO"]
  callback_urls = local.callback_urls
  logout_urls = local.logout_urls
  allowed_oauth_scopes = local.allowed_oauth_scopes
  allowed_oauth_flows_user_pool_client = local.allowed_oauth_flows_user_pool_client
}

resource aws_cognito_user_pool_domain domain {
  domain    = local.cognito_domain
  certificate_arn = aws_acm_certificate.cert.arn
  user_pool_id    = aws_cognito_user_pool.user_pool.id
}

data aws_route53_zone selected {
  name         = local.zone
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
