locals {
  variables = {
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
        controlled_domain_part = "testcog.raphaelluckom"
      }
      route53_zone_name = "raphaelluckom.com"
    }
  }
  protected_site_domain = "${local.variables.protected_domain_routing.domain_parts.controlled_domain_part}.${local.variables.protected_domain_routing.domain_parts.top_level_domain}"
  cognito_domain = "auth.${local.protected_site_domain}"
}

module cognito_user_management {
  source = "github.com/RLuckom/terraform_modules//aws/state/user_mgmt/stele"
  additional_protected_domains = ["test.raphaelluckom.com"]
  system_id = local.variables.cognito_system_id
  protected_domain_routing = local.variables.protected_domain_routing
  aws_credentials_file = local.variables.aws_credentials_file
  user_group_name = local.variables.user_group_name
  user_email = local.variables.user_email
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
}

module test_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/tetrapod"
  maintainer = var.maintainer
  nav_links = var.nav_links
  site_title = var.test_site_title
  asset_path = "${path.root}/sites/test.raphaelluckom.com/assets"
  system_id = {
    security_scope = "test"
    subsystem_name = "test"
  }
  access_control_function_qualified_arns = [{
    refresh_auth   = module.access_control_functions.refresh_auth.lambda.qualified_arn
    parse_auth   = module.access_control_functions.parse_auth.lambda.qualified_arn
    check_auth   = module.access_control_functions.check_auth.lambda.qualified_arn
    sign_out   = module.access_control_functions.sign_out.lambda.qualified_arn
    http_headers   = module.access_control_functions.http_headers.lambda.qualified_arn
  }]
  routing = {
    domain_parts = module.visibility_system.serverless_site_configs["test"].domain_parts
    route53_zone_name = var.route53_zone_name
  }
  site_bucket = "test.raphaelluckom.com"
  #coordinator_data = module.visibility_system.serverless_site_configs["test"]
  #subject_alternative_names = ["www.test.raphaelluckom.com"]
  trails_table_name = "test-trails_table"
  lambda_event_configs = local.notify_failure_only
  #layer_arns = {
  #  donut_days = module.donut_days.layer.arn,
  #  markdown_tools = module.markdown_tools.layer.arn,
  #}
}
