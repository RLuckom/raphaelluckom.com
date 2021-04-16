module visibility_system {
  source = "github.com/RLuckom/terraform_modules//aws/visibility/aurochs"
  cloudfront_delivery_bucket = "${var.bucket_prefix}-cloudfront-delivery"
  visibility_data_bucket = "${var.bucket_prefix}-visibility-data"
  donut_days_layer = module.donut_days.layer_config
  lambda_event_configs = local.notify_failure_only
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
          serverless_site_configs = {
            raphaelluckom_com = {}
          }
        }
        human = {
          scoped_logging_functions = concat(module.human_attention_archive.lambda_logging_roles, [module.upload_img.role.arn])
          glue_permission_name_map = {
            add_partition_permission_names = []
            add_partition_permission_arns = []
            query_permission_names = []
            query_permission_arns = []
          }
          serverless_site_configs = {}
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
          serverless_site_configs = {}
        }
        admin = {
          scoped_logging_functions = []
          glue_permission_name_map = {
            add_partition_permission_names = []
            add_partition_permission_arns = []
            query_permission_names = []
            query_permission_arns = []
          }
          serverless_site_configs = {}
        }
      }
    }
  }
  supported_system_definitions = {
    prod = {
      subsystems = {
        prod = {
          serverless_site_configs = {
            raphaelluckom_com = {
              domain_parts = {
                top_level_domain = "com"
                controlled_domain_part = "raphaelluckom"
              }
            }
          }
        }
        human = {
          serverless_site_configs = {}
        }
      }
    }
    test = {
      subsystems = {
        admin = {
          serverless_site_configs = {
            test_admin = {
              domain_parts = {
                top_level_domain = "com"
                controlled_domain_part = "admin.raphaelluckom"
              }
            }
          }
        }
        test = {
          serverless_site_configs = {
            test = {
              domain_parts = {
                top_level_domain = "com"
                controlled_domain_part = "test.raphaelluckom"
              }
            }
          }
        }
      }
    }
  }
}
