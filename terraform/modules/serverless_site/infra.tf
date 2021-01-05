
locals {
  render_arn = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:site_render-${var.site_name}"
  render_name = "site_render-${var.site_name}"
  deletion_cleanup_arn = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:deletion_cleanup-${var.site_name}"
  deletion_cleanup_name = "deletion_cleanup-${var.site_name}"
  render_invoke_permission = [{
    actions   =  [
      "lambda:InvokeFunction"
    ]
    resources = [
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:site_render-${var.site_name}",
    ]
  }]
}

locals {
  site_bucket = var.domain_settings.domain_name
  site_bucket_put_permission = [{
    actions   =  [
      "s3:PutObject"
    ]
    resources = [
      "arn:aws:s3:::${var.domain_settings.domain_name}/*",
    ]
  }]
  logging_bucket_put_permission = [{
    actions   =  [
      "s3:PutObject"
    ]
    resources = [
      "arn:aws:s3:::${var.logging_bucket}/*",
    ]
  }]
  site_bucket_delete_permission = [{
    actions   =  [
      "s3:DeleteObject"
    ]
    resources = [
      "arn:aws:s3:::${var.domain_settings.domain_name}/*",
    ]
  }]
}

module "site_render" {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  timeout_secs = 40
  mem_mb = 256
  debug = var.debug
  config_contents = templatefile("${path.root}/functions/configs/render_markdown_to_html/config.js",
    {
      website_bucket = local.site_bucket
      domain_name = var.domain_settings.domain_name
      site_description_path = "site_description.json"
      dependency_update_function = module.trails_updater.lambda.arn
    })
  additional_helpers = [
    {
      helper_name = "render.js"
      file_contents = file("${path.root}/functions/libraries/src/helpers/render.js")
    },
    {
      helper_name = "idUtils.js"
      file_contents = file("${path.root}/functions/libraries/src/helpers/idUtils.js")
    },
  ]
  lambda_event_configs = var.lambda_event_configs
  action_name = "site_render"
  scope_name = var.site_name
  source_bucket = var.lambda_bucket
  policy_statements =  concat(
    module.trails_updater.permission_sets.invoke
  )
  donut_days_layer_arn = var.layer_arns.donut_days
  additional_layers = [
    var.layer_arns.markdown_tools,
  ]
}

module "deletion_cleanup" {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  timeout_secs = 40
  mem_mb = 128
  debug = var.debug
  log_bucket = var.logging_bucket
  config_contents = templatefile("${path.root}/functions/configs/deletion_cleanup/config.js",
  {
    website_bucket = local.site_bucket
    domain_name = var.domain_settings.domain_name
    site_description_path = "site_description.json"
    dependency_update_function = module.trails_updater.lambda.arn
  }) 
  additional_helpers = [
    {
      helper_name = "idUtils.js"
      file_contents = file("${path.root}/functions/libraries/src/helpers/idUtils.js")
    },
  ]
  lambda_event_configs = var.lambda_event_configs
  action_name = "deletion_cleanup"
  scope_name = var.site_name
  source_bucket = var.lambda_bucket
  policy_statements =  concat(
    module.trails_updater.permission_sets.invoke
  )
  donut_days_layer_arn = var.layer_arns.donut_days
  additional_layers = [
    var.layer_arns.markdown_tools,
  ]
}

module "trails_updater" {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  timeout_secs = 40
  mem_mb = 192
  debug = var.debug
  log_bucket = var.logging_bucket
  config_contents = templatefile("${path.root}/functions/configs/update_trails/config.js",
    {
      table = module.trails_table.table.name,
      reverse_association_index = "reverseDependencyIndex"
      domain_name = var.domain_settings.domain_name
      site_description_path = "site_description.json"
      render_function = local.render_arn
      self_type = "relations.meta.trail"
    })
  additional_helpers = [
    {
      helper_name = "idUtils.js"
      file_contents = file("${path.root}/functions/libraries/src/helpers/idUtils.js")
    },
    {
      helper_name = "trails.js"
      file_contents = file("${path.root}/functions/libraries/src/trails.js")
    },
  ]
  lambda_event_configs = var.lambda_event_configs
  action_name = "trails_updater"
  scope_name = var.site_name
  source_bucket = var.lambda_bucket
  policy_statements = concat(
    local.render_invoke_permission,
    module.trails_table.permission_sets.read,
    module.trails_table.permission_sets.write,
    module.trails_table.permission_sets.delete_item,
  )
  donut_days_layer_arn = var.layer_arns.donut_days
  additional_layers = [
    var.layer_arns.markdown_tools,
  ]
}
