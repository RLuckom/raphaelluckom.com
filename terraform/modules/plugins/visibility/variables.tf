variable name {
  type = string
}

variable region {
  type = string
}

variable account_id {
  type = string
}

variable admin_site_resources {
  type = object({
    default_styles_path = string
    default_scripts_path = string
    header_contents = string
    footer_contents = string
    site_title = string
    site_description = string
    aws_script_path = string
    lodash_script_path = string
    exploranda_script_path = string
  })
  default = {
    aws_script_path = ""
    lodash_script_path = ""
    exploranda_script_path = ""
    default_styles_path = ""
    default_scripts_path = ""
    header_contents = "<div class=\"header-block\"><h1 class=\"heading\">Private Site</h1></div>"
    footer_contents = "<div class=\"footer-block\"><h1 class=\"footing\">Private Site</h1></div>"
    site_title = "running_material.site_title"
    site_description = "running_material.site_description"
  }
}

variable plugin_config {
  type = object({
    domain = string
    bucket_name = string
    upload_root = string
    api_root = string
    aws_credentials_endpoint = string
    hosting_root = string
    source_root = string
    authenticated_role = object({
      arn = string
      name = string
    })
  })
}

module ui {
  source = "github.com/RLuckom/terraform_modules//themes/icknield/admin_site_plugin_ui"
  name = var.name
  region = var.region
  account_id = var.account_id
  gopher_config_contents = "window.GOPHER_CONFIG = {}"
  admin_site_resources = var.admin_site_resources
  plugin_config = var.plugin_config
  config_values = {}
  default_css_paths = []
  default_script_paths = []
  default_deferred_script_paths = []
  page_configs = {
    index = {
      css_paths = []
      script_paths = []
      deferred_script_paths = []
      render_config_path = "${path.module}/src/frontend/libs/index.js"
    }
  }
  plugin_file_configs = [
  ]
}
locals {
  file_prefix = trim(var.plugin_config.source_root, "/")
}

output files {
  value = module.ui.files
}

output plugin_config {
  value = {
    name = var.name
    slug = "explore system metrics"
  }
}

output static_config {
  value = {
    api_name = var.name
    display_name = var.name
    role_name_stem = var.name
  }
}
