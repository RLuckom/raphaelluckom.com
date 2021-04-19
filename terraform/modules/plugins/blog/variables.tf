variable default_styles_path {
  type = string
}

variable file_prefix {
  type = string
  default = "/plugins/blog"
}

locals {
  file_prefix = trim(var.file_prefix, "/")
  editor_styles_path = "${local.file_prefix}/assets/styles/editor.css"
  exploranda_script_path = "${local.file_prefix}/assets/js/exploranda-browser.js"
  aws_script_path = "${local.file_prefix}/assets/js/aws-sdk-2.868.0.min.js"
  index_js_path = "${local.file_prefix}/assets/js/index-dist.js"
  files = [
    {
      key = "${local.file_prefix}/index.html"
      file_contents = templatefile("${path.module}/index.html", {
      editor_styles_path = local.editor_styles_path
      default_styles_path = var.default_styles_path
      exploranda_script_path = local.exploranda_script_path
      aws_script_path = local.aws_script_path
      index_js_path = local.index_js_path
    })
      content_type = "text/html"
      file_path = ""
    },
    {
      key = local.index_js_path
      file_contents = null
      file_path = "${path.module}/index-dist.js"
      content_type = "application/javascript"
    },
    {
      key = local.editor_styles_path
      file_path = ""
      file_contents = file("${path.module}/editor.css")
      content_type = "text/css"
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
