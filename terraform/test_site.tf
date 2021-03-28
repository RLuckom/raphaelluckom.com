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
  replication_function_logging_config = module.visibility_system.lambda_log_configs["prod"]["human"].config
  //TODO: check cors
  cors_rules = [{
    allowed_headers = ["authorization", "content-type", "x-amz-content-sha256", "x-amz-date", "x-amz-security-token", "x-amz-user-agent"]
    allowed_methods = ["PUT"]
    allowed_origins = ["https://admin.raphaelluckom.com"]
    expose_headers = ["ETag"]
    max_age_seconds = 3000
  }]
  prefix_object_permissions = [
    {
      permission_type = "put_object"
      prefix = "uploads/test-site/img/"
      arns = [module.cognito_identity_management.authenticated_role.arn]
    }
  ]
  replication_configuration = {
    role_arn = ""
    donut_days_layer = module.donut_days.layer_config
    rules = [
      {
        priority = 1
        filter = {
          prefix = "uploads/test-site/img/"
          suffix = ""
          tags = {}
        }
        enabled = true
        destination = {
          bucket = module.admin_site.website_bucket_name
          prefix = "staged-images/"
          manual = true
        }
      },
    ]
  }
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
    "Content-Security-Policy" = "default-src 'self'; connect-src 'self' https://athena.us-east-1.amazonaws.com https://test-human-attention.s3.amazonaws.com; img-src 'self' data:;"
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
  website_bucket_prefix_object_permissions = [
    {
      permission_type = "put_object"
      prefix = "staged-images/"
      arns = [module.human_attention_bucket.replication_lambda.role_arn]
    }
  ]
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
  mem_mb = 128
  logging_config = module.visibility_system.lambda_log_configs["prod"]["human"].config
  config_contents = <<EOF
module.exports = {
  stages: {
    intro: {
      index: 0,
      transformers: {
        mediaId: {
          or: [
            {ref: 'event.mediaId'},
            {helper: "uuid"},
          ]
        },
        widths: { value: [100, 300, 500, 750, 1000, 2500] },
        bucket: {
          or: [
            {ref: 'event.bucket'},
            {ref: 'event.Records[0].s3.bucket.name'},
          ]
        },
        imageKey: {
          or: [
            {ref: 'event.imageKey'},
            {ref: 'event.Records[0].s3.object.key'},
          ]
        },
      },
      dependencies: {
        getImage: {
          action: 'getImageAutoRotated',
          params: {
            inputBucket: { ref: 'stage.bucket' },
            inputKey: { ref: 'stage.imageKey' },
          }
        },
        archiveImage: {
          action: 'archiveImage',
          params: {
            imageMetaDependencyName: { 
              helper: 'qualifiedDependencyName',
              params: {
                configStepName: { value: 'getImage' },
                dependencyName: { value: 'image' },
              },
            },
            autoRotatedImageDependencyName: { 
              helper: 'qualifiedDependencyName',
              params: {
                configStepName: { value: 'getImage' },
                dependencyName: { value: 'autoRotatedImage' },
              },
            },
            mediaStorageBucket: { value: '$ {media_storage_bucket}' },
            mediaStoragePrefix: { value: '$ {media_storage_prefix}' },
            mediaDynamoTable: { value: '$ {media_dynamo_table}' },
            labeledMediaTable: { value: '$ {labeled_media_dynamo_table}' },
            mediaType: { value: 'IMAGE' },
            bucket: { ref: 'stage.bucket' },
            key: { ref: 'stage.imageKey' },
            mediaId: { ref: 'stage.mediaId' },
          }
        },
        publishImageWebSizes: {
          action: 'publishImageWebSizes',
          condition: {
            or: [
              {
                helper: 'isInList',
                params: {
                  list: {value: ['$ {post_input_bucket_name}']},
                  item: { ref: 'stage.bucket' }
                }
              },
              {ref: 'stage.publish'}
            ]
          },
          params: {
            autoRotatedImageDependencyName: { 
              helper: 'qualifiedDependencyName',
              params: {
                configStepName: { value: 'getImage' },
                dependencyName: { value: 'autoRotatedImage' },
              },
            },
            publicHostingBucket: { value: '$ {media_hosting_bucket}' },
            publicHostingPrefix: { value: '$ {media_storage_prefix}' },
            mediaId: { ref: 'stage.mediaId' },
            widths: { ref: 'stage.widths' },
          }
        },
      }
    }
  }
}
EOF
  lambda_event_configs = local.notify_failure_only
  action_name = "upload_img"
  scope_name = module.visibility_system.lambda_log_configs["prod"]["human"].security_scope
  donut_days_layer = module.donut_days.layer_config
}
