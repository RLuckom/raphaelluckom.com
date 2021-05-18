variable name {
  type = string
}

variable region {
  type = string
}

variable account_id {
  type = string
}

variable maintainer {
  type = object({
    name = string
    email = string
  })
  default = {
    name = ""
    email = ""
  }
}

variable nav_links {
  type = list(object({
    name = string
    target = string
  }))
  default = []
}

variable site_title {
  type = string
  default = "Test Site"
}

variable admin_site_resources {
  type = object({
    default_styles_path = string
    default_scripts_path = string
    header_contents = string
    footer_contents = string
    site_title = string
    site_description = string
  })
  default = {
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

variable coordinator_data {
  type = object({
    system_id = object({
      security_scope = string
      subsystem_name = string
    })
    routing = object({
      domain_parts = object({
        top_level_domain = string
        controlled_domain_part = string
      })
      domain = string
      route53_zone_name = string
    })
    // these can be set to "" if NA
    lambda_log_delivery_prefix = string
    lambda_log_delivery_bucket = string
    cloudfront_log_delivery_prefix = string
    cloudfront_log_delivery_bucket = string
  })
}

variable image_layer {
  type = object({
    present = bool
    arn = string
  })
  default = {
    present = false
    arn = ""
  }
}

variable donut_days_layer {
  type = object({
    present = bool
    arn = string
  })
  default = {
    present = false
    arn = ""
  }
}

variable markdown_tools_layer {
  type = object({
    present = bool
    arn = string
  })
  default = {
    present = false
    arn = ""
  }
}

variable lambda_event_configs {
  type = list(object({
    maximum_event_age_in_seconds = number
    maximum_retry_attempts = number
    on_success = list(object({
      function_arn = string
    }))
    on_failure = list(object({
      function_arn = string
    }))
  }))
  default = []
}

variable logging_config {
  type = object({
    bucket = string
    prefix = string
  })
  default = {
    bucket = ""
    prefix = ""
  }
}

variable library_const_names {
  type = list(string)
  default = [
    "yaml",
    "moment",
    "hljs", 
    "prosemirror",
    "uuid"
  ]
}

locals {
  blog_image_hosting_root = "/img/"
  blog_image_hosting_prefix = "img/"
  blog_post_hosting_root = "/posts/"
  blog_post_hosting_prefix = "posts/"
  plugin_image_hosting_prefix = "${var.plugin_config.hosting_root}img/"
  plugin_post_hosting_prefix = "${var.plugin_config.hosting_root}posts/"
  file_prefix = trim(var.plugin_config.source_root, "/")
  edit_styles_path = "${local.file_prefix}/assets/styles/editor.css"
  plugin_default_styles_path = "${local.file_prefix}/assets/styles/default.css"
  plugin_index_styles_path = "${local.file_prefix}/assets/styles/index.css"
  exploranda_script_path = "${local.file_prefix}/assets/js/exploranda-browser.js"
  config_path = "${local.file_prefix}/assets/js/config.js"
  aws_script_path = "${local.file_prefix}/assets/js/aws-sdk-2.868.0.min.js"
  edit_js_path = "${local.file_prefix}/assets/js/index-${filemd5("${path.module}/src/frontend/libs/edit.js")}.js"
  index_js_path = "${local.file_prefix}/assets/js/index-${filemd5("${path.module}/src/frontend/libs/index.js")}.js"
  utils_js_path = "${local.file_prefix}/assets/js/utils-${filemd5("${path.module}/src/frontend/libs/utils.js")}.js"
  gopher_config_js_path = "${local.file_prefix}/assets/js/gopher_config-${filemd5("${path.module}/src/frontend/libs/gopher_config.js")}.js"
  post_utils_js_path = "${local.file_prefix}/assets/js/post-utils-${filemd5("${path.module}/src/frontend/libs/post_utils.js")}.js"
  libs_js_path = "${local.file_prefix}/assets/js/pkg-${filemd5("${path.module}/src/frontend/libs/libs.js")}.js"
  prosemirror_setup_js_path = "${local.file_prefix}/assets/js/prosemirror-setup-${filemd5("${path.module}/src/frontend/libs/prosemirror-setup.js")}.js"
  plugin_config = {
    website_bucket = module.blog_site.website_bucket_name
    blog_image_hosting_root = local.blog_image_hosting_root
    blog_image_hosting_prefix = local.blog_image_hosting_prefix
    blog_post_hosting_root = local.blog_post_hosting_root
    blog_post_hosting_prefix = local.blog_post_hosting_prefix
    domain = var.plugin_config.domain
    operator_name = var.maintainer.name
    private_storage_bucket = var.plugin_config.bucket_name
    upload_root = "${trimsuffix(var.plugin_config.upload_root, "/")}/"
    aws_credentials_endpoint = var.plugin_config.aws_credentials_endpoint
    plugin_root = "${trimsuffix(var.plugin_config.source_root, "/")}/"
    api_root = "${trimsuffix(var.plugin_config.api_root, "/")}/"
    hosting_root = "${trimsuffix(var.plugin_config.hosting_root, "/")}/"
    plugin_image_upload_path = "${trimsuffix(var.plugin_config.upload_root, "/")}/img/"
    plugin_post_upload_path = "${trimsuffix(var.plugin_config.upload_root, "/")}/posts/"
    plugin_image_hosting_path = "${trimsuffix(var.plugin_config.hosting_root, "/")}/img/"
    plugin_post_hosting_path = "${trimsuffix(var.plugin_config.hosting_root, "/")}/posts/"
    plugin_image_hosting_prefix = local.plugin_image_hosting_prefix
    plugin_post_hosting_prefix = local.plugin_post_hosting_prefix 
  }
  default_css_paths = [
    var.admin_site_resources.default_styles_path,
    local.plugin_default_styles_path,
  ]
  index_css_paths = [
    local.plugin_index_styles_path,
  ]
  edit_css_paths = [
    local.edit_styles_path
  ]
  default_deferred_script_paths = [
    var.admin_site_resources.default_scripts_path,
  ]
  default_script_paths = [
    local.aws_script_path,
    local.libs_js_path,
    local.exploranda_script_path,
    local.config_path,
    local.gopher_config_js_path,
    local.utils_js_path,
    local.post_utils_js_path,
  ]
  index_script_paths = [
    local.index_js_path
  ]
  edit_script_paths = [
    local.prosemirror_setup_js_path,
    local.edit_js_path
  ]
  files = [
    {
      key = local.config_path
      file_contents = <<EOF
window.CONFIG = ${jsonencode(local.plugin_config)}
const {${join(", ", var.library_const_names)}} = window.LIBRARIES
EOF
      file_path = null
      content_type = "application/javascript"
    },
    {
      key = "${local.file_prefix}index.html"
      file_contents = templatefile("${path.module}/src/frontend/index.html", {
      operator = var.maintainer.name
      running_material = var.admin_site_resources
      css_paths = concat(
        local.default_css_paths,
        local.index_css_paths
      )
      script_paths = concat(
        local.default_script_paths,
        local.index_script_paths
      )
      deferred_script_paths = local.default_deferred_script_paths
    })
      content_type = "text/html"
      file_path = ""
    },
    {
      key = "${local.file_prefix}edit.html"
      file_contents = templatefile("${path.module}/src/frontend/index.html", {
      running_material = var.admin_site_resources
      css_paths = concat(
        local.default_css_paths,
        local.edit_css_paths
      )
      script_paths = concat(
        local.default_script_paths,
        local.edit_script_paths
      )
      deferred_script_paths = local.default_deferred_script_paths
    })
      content_type = "text/html"
      file_path = ""
    },
    {
      key = local.libs_js_path
      file_contents = null
      file_path = "${path.module}/src/frontend/libs/pkg.js"
      content_type = "application/javascript"
    },
    {
      key = local.prosemirror_setup_js_path
      file_contents = null
      file_path = "${path.module}/src/frontend/libs/prosemirror-setup.js"
      content_type = "application/javascript"
    },
    {
      key = local.edit_js_path
      file_contents = null
      file_path = "${path.module}/src/frontend/libs/edit.js"
      content_type = "application/javascript"
    },
    {
      key = local.index_js_path
      file_contents = null
      file_path = "${path.module}/src/frontend/libs/index.js"
      content_type = "application/javascript"
    },
    {
      key = local.post_utils_js_path
      file_contents = null
      file_path = "${path.module}/src/frontend/libs/post_utils.js"
      content_type = "application/javascript"
    },
    {
      key = local.gopher_config_js_path
      file_contents = null
      file_path = "${path.module}/src/frontend/libs/gopher_config.js"
      content_type = "application/javascript"
    },
    {
      key = local.utils_js_path
      file_contents = null
      file_path = "${path.module}/src/frontend/libs/utils.js"
      content_type = "application/javascript"
    },
    {
      key = local.plugin_index_styles_path
      file_path = ""
      file_contents = file("${path.module}/src/frontend/styles/index.css")
      content_type = "text/css"
    },
    {
      key = local.plugin_default_styles_path
      file_path = ""
      file_contents = file("${path.module}/src/frontend/styles/default.css")
      content_type = "text/css"
    },
    {
      key = local.edit_styles_path
      file_path = ""
      file_contents = file("${path.module}/src/frontend/styles/editor.css")
      content_type = "text/css"
    },
    {
      key = local.exploranda_script_path
      file_contents = null
      file_path = "${path.module}/src/frontend/libs/exploranda-browser.js"
      content_type = "application/javascript"
    },
    {
      key = local.aws_script_path
      file_contents = null
      file_path = "${path.module}/src/frontend/libs/aws-sdk-2.868.0.min.js"
      content_type = "application/javascript"
    },
  ]
}

output files {
  value = [ for conf in local.files : {
    plugin_relative_key = replace(conf.key, local.file_prefix, "")
    file_contents = conf.file_contents
    file_path = conf.file_path
    content_type = conf.content_type
  }]
}

output plugin_config {
  value = {
    name = "blog"
    slug = "manage blog posts"
  }
}
