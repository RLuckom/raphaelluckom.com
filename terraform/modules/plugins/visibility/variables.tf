variable default_styles_path {
  type = string
}

variable file_prefix {
  type = string
  default = "/plugins/visibility"
}

locals {
  file_prefix = trim(var.file_prefix, "/")
  exploranda_script_path = "${local.file_prefix}/assets/js/exploranda-browser.js"
  aws_script_path = "${local.file_prefix}/assets/js/aws-sdk-2.868.0.min.js"
  index_js_path = "${local.file_prefix}/assets/js/main.js"
  files = [
    {
      key = "${local.file_prefix}/index.html"
      file_path = ""
      file_contents = templatefile("${path.module}/index.html", {
      default_styles_path = var.default_styles_path
      exploranda_script_path = local.exploranda_script_path
      aws_script_path = local.aws_script_path
      index_js_path = local.index_js_path
    })
      content_type = "text/html"
    },
    {
      key = local.index_js_path
      file_contents = null
      file_path = "${path.module}/main.js"
      content_type = "application/javascript"
    },
    {
      key = local.exploranda_script_path
      file_contents = null
      file_path = "${path.module}/exploranda-browser.js"
      content_type = "application/javascript"
    },
    {
      key = local.aws_script_path
      file_contents = null
      file_path = "${path.module}/aws-sdk-2.868.0.min.js"
      content_type = "application/javascript"
    },
  ]
}

output files {
  value = [ for conf in local.files : {
    key = trimprefix(conf.key, "/")
    file_path = conf.file_path
    file_contents = conf.file_contents
    content_type = conf.content_type
  }]
}

output plugin_config {
  value = {
    name = "visibility"
    slug = "operational metrics"
  }
}
