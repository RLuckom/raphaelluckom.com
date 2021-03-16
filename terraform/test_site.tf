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

locals {
  get_access_creds_function = <<EOF
const AWS = require('aws-sdk')
const { parse } = require("cookie")

function handler(event, context, callback) {
  console.log(event)
  console.log(callback)
  const cognitoidentity = new AWS.CognitoIdentity({region: 'us-east-1'});
  const idToken = parse(event.headers['Cookie'])['ID-TOKEN']
  const params = {
    IdentityPoolId: '${aws_cognito_identity_pool.id_pool.id}',
    Logins: {
      '${module.cognito_user_management.user_pool.endpoint}': idToken,
    }
  }
  cognitoidentity.getId(params, function(err, data) {
    if (err) {
      return callback(err)
    }
    cognitoidentity.getCredentialsForIdentity({
      IdentityId: data.IdentityId,
      Logins: params.Logins 
    }, (e, d) => {
      if (e) {
        return callback(err)
      }
      const response = {
        statusCode: "200",
        cookies: [],
        "headers": {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(d)
      };
      return callback(null, response)
    })
  });
}

module.exports = {
  handler
}
EOF
}

module get_access_creds {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  timeout_secs = 2
  mem_mb = 128
  source_contents = [
    {
      file_name = "index.js"
      file_contents = local.get_access_creds_function
    },
  ]
  lambda_details = {
    action_name = "get_access_creds"
    scope_name = "test"
    bucket = aws_s3_bucket.lambda_bucket.id
    policy_statements = []
  }
  layers = [module.aws_sdk.layer_config]
}

    #issuer   = each.value.issuer #"https://${aws_cognito_user_pool.example.endpoint}"
module test_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/capstan"
  system_id = {
    security_scope = "test"
    subsystem_name = "test"
  }
  lambda_authorizers = {
    "default" = {
    name = "default"
    audience = [module.cognito_user_management.user_pool_client.id]
    issuer = "https://${module.cognito_user_management.user_pool.endpoint}"
    identity_sources = ["$request.header.Authorization"]
    }
  }
  lambda_origins = [{
    # This is going to be the origin_id in cloudfront. Should be a string
    # that suggests the function's purpose
    id = "get_access_tokens"
    # This should only be set to true if the access_control_function_qualified_arns
    # above are set AND you want the function access-controlled
    authorizer = "default"
    # unitary path denoting the function's endpoint, e.g.
    # "/meta/relations/trails"
    path = "/api/actions/access/credentials"
    # cloudfront routing pattern e.g.
    # "/meta/relations/trails*"
    site_path = "/api/actions/access/credentials"
    # apigateway path expression e.g.
    # "/meta/relations/trails/{trail+}"
    apigateway_path = "/api/actions/access/credentials"
    # Usually all lambdas in a dist should share one gateway, so the gway
    # name stems should be the same across all lambda endpoints.
    # But if you wanted multiple apigateways within a single dist., you
    # could set multiple name stems and the lambdas would get allocated
    # to different gateways
    gateway_name_stem = "test_site"
    allowed_methods = ["GET", "HEAD"]
    cached_methods = ["GET", "HEAD"]
    compress = true
    ttls = {
      min = 0
      default = 0
      max = 0
    }
    forwarded_values = {
      # usually true
      query_string = true
      # usually empty list
      query_string_cache_keys = []
      # probably best left to empty list; that way headers used for
      # auth can't be leaked by insecure functions. If there's
      # a reason to want certain headers, go ahead.
      headers = []
      cookie_names = ["ID-TOKEN"]
    }
    lambda = {
      arn = module.get_access_creds.lambda.arn
      name = module.get_access_creds.lambda.function_name
    }
  }]
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
  site_bucket = "test.raphaelluckom.com"
  coordinator_data = module.visibility_system.serverless_site_configs["test"]
  subject_alternative_names = ["www.test.raphaelluckom.com"]
}
