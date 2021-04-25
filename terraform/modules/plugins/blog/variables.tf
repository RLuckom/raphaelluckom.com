variable default_styles_path {
  type = string
}

variable name {
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

variable plugin_config {
  type = object({
    domain = string
    bucket_name = string
    upload_root = string
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

locals {
  file_prefix = trim(var.plugin_config.source_root, "/")
  editor_styles_path = "${local.file_prefix}/assets/styles/editor.css"
  exploranda_script_path = "${local.file_prefix}/assets/js/exploranda-browser.js"
  config_path = "${local.file_prefix}/assets/js/config.js"
  aws_script_path = "${local.file_prefix}/assets/js/aws-sdk-2.868.0.min.js"
  index_js_path = "${local.file_prefix}/assets/js/index-${filemd5("${path.module}/src/frontend/index.js")}.js"
  prosemirror_js_path = "${local.file_prefix}/assets/js/prosemirror-pkg-${filemd5("${path.module}/src/frontend/prosemirror-libs.js")}.js"
  plugin_config = {
    domain = var.plugin_config.domain
    private_storage_bucket = var.plugin_config.bucket_name
    private_storage_image_upload_path = "${trimsuffix(var.plugin_config.upload_root, "/")}/img/"
    plugin_image_hosting_path = "${trimsuffix(var.plugin_config.hosting_root, "/")}/img/"
  }
  files = [
    {
      key = local.config_path
      file_contents = <<EOF
window.CONFIG = ${jsonencode(local.plugin_config)}
EOF
      file_path = null
      content_type = "application/javascript"
    },
    {
      key = "${local.file_prefix}/index.html"
      file_contents = templatefile("${path.module}/src/frontend/index.html", {
      editor_styles_path = local.editor_styles_path
      default_styles_path = var.default_styles_path
      exploranda_script_path = local.exploranda_script_path
      aws_script_path = local.aws_script_path
      index_js_path = local.index_js_path
      prosemirror_js_path = local.prosemirror_js_path
      config_path = local.config_path
    })
      content_type = "text/html"
      file_path = ""
    },
    {
      key = local.prosemirror_js_path
      file_contents = null
      file_path = "${path.module}/src/frontend/prosemirror-pkg.js"
      content_type = "application/javascript"
    },
    {
      key = local.index_js_path
      file_contents = null
      file_path = "${path.module}/src/frontend/index.js"
      content_type = "application/javascript"
    },
    {
      key = local.editor_styles_path
      file_path = ""
      file_contents = file("${path.module}/src/frontend/editor.css")
      content_type = "text/css"
    },
    {
      key = local.exploranda_script_path
      file_contents = null
      file_path = "${path.module}/src/frontend/exploranda-browser.js"
      content_type = "application/javascript"
    },
    {
      key = local.aws_script_path
      file_contents = null
      file_path = "${path.module}/src/frontend/aws-sdk-2.868.0.min.js"
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
