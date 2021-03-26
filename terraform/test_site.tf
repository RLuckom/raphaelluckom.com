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

module human_attention_bucket {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/bucket"
  name = "test-human-attention"
  replication_lambda_event_configs = local.notify_failure_only
  security_scope = "prod"
  replication_function_logging_config = {
    bucket = module.visibility_system.lambda_log_configs["prod"]["human"].log_bucket
    prefix = module.visibility_system.lambda_log_configs["prod"]["human"].log_prefix
  }
  replication_configuration = {
    role_arn = ""
    donut_days_layer = module.donut_days.layer_config
    rules = [{
      priority = 1
      filter = {
        prefix = "foo/"
        suffix = ""
        tags = {}
      }
      enabled = true
      destination = {
        bucket = ""
        prefix = "bar/"
        manual = true
      }
    }]
  }
}

module cognito_user_management {
  source = "github.com/RLuckom/terraform_modules//aws/state/user_mgmt/stele"
  system_id = local.variables.cognito_system_id
  protected_domain_routing = local.variables.admin_domain_routing
  user_group_name = local.variables.user_group_name
  user_email = local.variables.user_email
}

module cognito_identity_management {
  source = "github.com/RLuckom/terraform_modules//aws/access_control/hinge"
  system_id = local.variables.cognito_system_id
  client_id               = module.cognito_user_management.user_pool_client.id
  provider_endpoint           = module.cognito_user_management.user_pool.endpoint
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
  client_id = module.cognito_user_management.user_pool_client.id
  aws_sdk_layer = module.aws_sdk.layer_config
}

module admin_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/capstan"
  system_id = {
    security_scope = "test"
    subsystem_name = "test"
  }
  asset_path = "${path.root}/sites/private"
  lambda_authorizers = module.get_access_creds.lambda_authorizer_config
  lambda_origins = module.get_access_creds.lambda_origins
  routing = local.variables.admin_domain_routing
  access_control_function_qualified_arns = [module.access_control_functions.access_control_function_qualified_arns]
  coordinator_data = module.visibility_system.serverless_site_configs["test_admin"]
  subject_alternative_names = ["www.admin.raphaelluckom.com"]
}
