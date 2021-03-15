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

resource "aws_iam_role" "authenticated" {
  name = "cognito_authenticated"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "${aws_cognito_identity_pool.id_pool.id}"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
EOF
}

data "aws_iam_policy_document" "allow_list_buckets" {
  statement {
    sid = "1"

    actions = [
      "s3:ListAllMyBuckets",
    ]

    resources = [
      "arn:aws:s3:::*",
    ]
  }
}

resource "aws_iam_policy" "test_cog_id_pol" {
  name   = "example_policy"
  path   = "/"
  policy = data.aws_iam_policy_document.allow_list_buckets.json
}

resource "aws_iam_role_policy_attachment" "test-attach" {
  role       = aws_iam_role.authenticated.name
  policy_arn = aws_iam_policy.test_cog_id_pol.arn
}

resource "aws_cognito_identity_pool" "id_pool" {
  identity_pool_name               = "identity pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = module.cognito_user_management.user_pool_client.id
    provider_name           = module.cognito_user_management.user_pool.endpoint
    server_side_token_check = true
  }
}

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.id_pool.id

  roles = {
    "authenticated" = aws_iam_role.authenticated.arn
  }
}



module test_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/capstan"
  system_id = {
    security_scope = "test"
    subsystem_name = "test"
  }
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
  }]
  site_bucket = "test.raphaelluckom.com"
  coordinator_data = module.visibility_system.serverless_site_configs["test"]
  subject_alternative_names = ["www.test.raphaelluckom.com"]
}
