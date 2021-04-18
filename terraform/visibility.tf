module visibility_system {
  source = "github.com/RLuckom/terraform_modules//aws/visibility/aurochs"
  cloudfront_delivery_bucket = "${var.bucket_prefix}-cloudfront-delivery"
  visibility_data_bucket = "${var.bucket_prefix}-visibility-data"
  donut_days_layer = module.donut_days.layer_config
  lambda_event_configs = local.notify_failure_only
  supported_system_definitions = var.supported_system_definitions
  supported_system_clients = {
    prod = {
      subsystems = {
        prod = {
          scoped_logging_functions = module.prod_site.lambda_logging_roles
          glue_permission_name_map = {
            add_partition_permission_names = []
            add_partition_permission_arns = []
            query_permission_names = [module.cognito_identity_management.authenticated_role["athena"].name]
            query_permission_arns = [module.cognito_identity_management.authenticated_role["athena"].arn]
          }
        }
        human = {
          scoped_logging_functions = concat(module.human_attention_archive.lambda_logging_roles, [module.process_image_uploads.lambda_role.arn])
          glue_permission_name_map = {
            add_partition_permission_names = []
            add_partition_permission_arns = []
            query_permission_names = []
            query_permission_arns = []
          }
        }
      }
    }
    test = {
      subsystems = {
        test = {
          scoped_logging_functions = []
          glue_permission_name_map = {
            add_partition_permission_names = []
            add_partition_permission_arns = []
            query_permission_names = []
            query_permission_arns = []
          }
        }
        admin = {
          scoped_logging_functions = []
          glue_permission_name_map = {
            add_partition_permission_names = []
            add_partition_permission_arns = []
            query_permission_names = []
            query_permission_arns = []
          }
        }
      }
    }
  }
}

module human_attention_archive {
  source = "github.com/RLuckom/terraform_modules//aws/state/object_store/replicated_archive"
  providers = {
    aws.replica1 = aws.frankfurt
    aws.replica2 = aws.sydney
    aws.replica3 = aws.canada
  }
  bucket_prefix = var.bucket_prefix
  security_scope = "prod"
  replication_lambda_event_configs = local.notify_failure_only
  replication_function_logging_config = module.visibility_system.lambda_log_configs["prod"]["human"].config
  donut_days_layer_config = module.donut_days.layer_config
  replication_sources = [{
    bucket = module.admin_site.website_bucket_name
    prefix = "uploads/"
    suffix = ""
    filter_tags = {}
    completion_tags = [{
      Key = "Archived"
      Value = "true"
    }]
    storage_class = "GLACIER"
  }]
}

module admin_site_visibility_plugin {
  source = "./modules/plugins/visibility"
  default_styles_path = module.admin_site_frontpage.default_styles_path
}
