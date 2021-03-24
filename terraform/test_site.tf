locals {
  variables = {
    site_bucket = "test.raphaelluckom.com"
    source = "test"
    source_instance = "test"
    component = "test"
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
        controlled_domain_part = "test.raphaelluckom"
      }
      route53_zone_name = "raphaelluckom.com"
    }
  }
  protected_site_domain = "${local.variables.protected_domain_routing.domain_parts.controlled_domain_part}.${local.variables.protected_domain_routing.domain_parts.top_level_domain}"
  cognito_domain = "auth.${local.protected_site_domain}"
}

module cognito_user_management {
  source = "github.com/RLuckom/terraform_modules//aws/state/user_mgmt/stele"
  system_id = local.variables.cognito_system_id
  protected_domain_routing = local.variables.protected_domain_routing
  aws_credentials_file = local.variables.aws_credentials_file
  user_group_name = local.variables.user_group_name
  user_email = local.variables.user_email
}

module cognito_identity_management {
  source = "github.com/RLuckom/terraform_modules//aws/access_control/hinge"
  system_id = local.variables.cognito_system_id
  client_id               = module.cognito_user_management.user_pool_client.id
  provider_endpoint           = module.cognito_user_management.user_pool.endpoint
  authenticated_policy_statements = [{
    actions = [
      "s3:ListAllMyBuckets",
    ]
    resources = [
      "arn:aws:s3:::*",
    ]
  }]
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
  auth_domain = "https://${local.cognito_domain}"
  user_group_name = local.variables.user_group_name
  log_source = local.variables.source
  log_source_instance = local.variables.source_instance
  component = local.variables.component
  http_header_values = {
    "Content-Security-Policy" = "default-src 'self'; connect-src 'self' https://athena.us-east-1.amazonaws.com;"
    "Strict-Transport-Security" = "max-age=31536000; includeSubdomains; preload"
    "Referrer-Policy" = "same-origin"
    "X-XSS-Protection" = "1; mode=block"
    "X-Frame-Options" = "DENY"
    "X-Content-Type-Options" = "nosniff"
  }
}

module get_access_creds {
  source = "github.com/RLuckom/terraform_modules//aws/access_control/cognito_to_aws_creds"
  identity_pool_id = module.cognito_identity_management.identity_pool.id
  user_pool_endpoint = module.cognito_user_management.user_pool.endpoint
  api_path = "/api/actions/access/credentials"
  gateway_name_stem = "test_site"
  aws_sdk_layer = module.aws_sdk.layer_config
}

module test_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/capstan"
  system_id = {
    security_scope = "test"
    subsystem_name = "test"
  }
  asset_path = "${path.root}/sites/private"
  lambda_authorizers = {
    "default" = {
    name = "default"
    audience = [module.cognito_user_management.user_pool_client.id]
    issuer = "https://${module.cognito_user_management.user_pool.endpoint}"
    identity_sources = ["$request.header.Authorization"]
    }
  }
  lambda_origins = module.get_access_creds.lambda_origins
  routing = {
    domain_parts = module.visibility_system.serverless_site_configs["test"].domain_parts
    route53_zone_name = var.route53_zone_name
  }
  access_control_function_qualified_arns = [{
    refresh_auth   = module.access_control_functions.refresh_auth.lambda.qualified_arn
    parse_auth   = module.access_control_functions.parse_auth.lambda.qualified_arn
    check_auth   = module.access_control_functions.check_auth.lambda.qualified_arn
    sign_out   = module.access_control_functions.sign_out.lambda.qualified_arn
    http_headers   = module.access_control_functions.http_headers.lambda.qualified_arn
    move_cookie_to_auth_header   = module.access_control_functions.move_cookie_to_auth_header.lambda.qualified_arn
  }]
  site_bucket = local.variables.site_bucket
  coordinator_data = module.visibility_system.serverless_site_configs["test"]
  subject_alternative_names = ["www.test.raphaelluckom.com"]
}
