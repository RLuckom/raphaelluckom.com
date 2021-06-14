module visibility_system {
  source = "github.com/RLuckom/terraform_modules//aws/visibility/aurochs?ref=cost-reports"
  account_id = local.account_id
  region = local.region
  bucket_prefix = var.bucket_prefix
  donut_days_layer = module.donut_days.layer_config
  lambda_event_configs = local.notify_failure_only
  supported_system_definitions = var.supported_system_definitions
  supported_system_clients = {
    prod = {
      metric_table_read_role_names = []
      subsystems = {
        prod = {
          scoped_logging_functions = module.admin_site_prod_blog_plugin.lambda_logging_arns
          glue_permission_name_map = {
            add_partition_permission_names = []
            add_partition_permission_arns = []
            query_permission_names = [module.admin_interface.plugin_authenticated_roles["visibility"].name]
            query_permission_arns = [module.admin_interface.plugin_authenticated_roles["visibility"].arn]
          }
        }
        human = {
          scoped_logging_functions = module.human_attention_archive.lambda_logging_roles
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
      metric_table_read_role_names = []
      subsystems = {
        test = {
          scoped_logging_functions = []
          scoped_logging_functions = module.admin_site_blog_plugin.lambda_logging_arns
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

module admin_site_visibility_plugin {
  source = "./modules/plugins/visibility"
  name = "visibility"
  account_id = local.account_id
  region = local.region
  admin_site_resources = module.admin_interface.site_resources
  plugin_config = module.admin_interface.plugin_config["visibility"]
}
