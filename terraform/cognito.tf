locals {
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

resource "aws_cognito_user_pool_domain" "domain" {
  domain          = "test-raphaelluckom-com"
  user_pool_id    = aws_cognito_user_pool.user_pool.id
}

