
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
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  timeout_secs = 40
  mem_mb = 256
  environment_var_map = {
    DONUT_DAYS_DEBUG = var.debug
  }
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("${path.root}/functions/libraries/src/entrypoints/generic_donut_days.js") 
    },
    {
      file_name = "helpers/render.js"
      file_contents = file("${path.root}/functions/libraries/src/helpers/render.js")
    },
    {
      file_name = "helpers/idUtils.js"
      file_contents = file("${path.root}/functions/libraries/src/helpers/idUtils.js")
    },
    {
      file_name = "helpers/formatters.js"
      file_contents = file("${path.root}/functions/libraries/src/formatters.js")
    },
    {
      file_name = "config.js"
      file_contents = templatefile("${path.root}/functions/configs/render_markdown_to_html/config.js",
    {
      website_bucket = local.site_bucket
      domain_name = var.domain_settings.domain_name
      site_description_path = "site_description.json"
      dependency_update_function = module.trails_updater.lambda.arn
    }) 
    }
  ]
  lambda_details = {
    action_name = "site_render"
    scope_name = var.site_name
    bucket = var.lambda_bucket
    policy_statements =  concat(
      local.site_bucket_put_permission,
      module.trails_updater.permission_sets.invoke
    )
  }
  layers = [
    var.layer_arns.donut_days,
    var.layer_arns.markdown_tools,
  ]
}

module "deletion_cleanup" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  timeout_secs = 40
  mem_mb = 128
  environment_var_map = {
    DONUT_DAYS_DEBUG = var.debug
  }
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("${path.root}/functions/libraries/src/entrypoints/generic_donut_days.js") 
    },
    {
      file_name = "helpers/idUtils.js"
      file_contents = file("${path.root}/functions/libraries/src/helpers/idUtils.js")
    },
    {
      file_name = "helpers/formatters.js"
      file_contents = file("${path.root}/functions/libraries/src/formatters.js")
    },
    {
      file_name = "config.js"
      file_contents = templatefile("${path.root}/functions/configs/deletion_cleanup/config.js",
    {
      website_bucket = local.site_bucket
      domain_name = var.domain_settings.domain_name
      site_description_path = "site_description.json"
      dependency_update_function = module.trails_updater.lambda.arn
    }) 
    }
  ]
  lambda_details = {
    action_name = "deletion_cleanup"
    scope_name = var.site_name
    bucket = var.lambda_bucket
    policy_statements =  concat(
      local.site_bucket_delete_permission,
      module.trails_updater.permission_sets.invoke
    )
  }
  layers = [
    var.layer_arns.donut_days,
    var.layer_arns.markdown_tools,
  ]
}

module "trails_updater" {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  timeout_secs = 40
  mem_mb = 192
  environment_var_map = {
    DONUT_DAYS_DEBUG = var.debug
    EXPLORANDA_DEBUG = var.debug
  }
  source_contents = [
    {
      file_name = "index.js"
      file_contents = file("${path.root}/functions/libraries/src/entrypoints/generic_donut_days.js") 
    },
    {
      file_name = "helpers/formatters.js"
      file_contents = file("${path.root}/functions/libraries/src/formatters.js")
    },
    {
      file_name = "helpers/idUtils.js"
      file_contents = file("${path.root}/functions/libraries/src/helpers/idUtils.js")
    },
    {
      file_name = "trails.js"
      file_contents = file("${path.root}/functions/libraries/src/trails.js")
    },
    {
      file_name = "config.js"
      file_contents = templatefile("${path.root}/functions/configs/update_trails/config.js",
    {
      table = module.trails_table.table.name,
      reverse_association_index = "reverseDependencyIndex"
      domain_name = var.domain_settings.domain_name
      site_description_path = "site_description.json"
      render_function = local.render_arn
      self_type = "relations.meta.trail"
    })
    }
  ]
  lambda_details = {
    action_name = "trails_updater"
    scope_name = var.site_name
    bucket = var.lambda_bucket
    policy_statements = concat(
      local.render_invoke_permission,
      module.trails_table.permission_sets.read,
      module.trails_table.permission_sets.write,
      module.trails_table.permission_sets.delete_item,
    )
  }
  layers = [
    var.layer_arns.donut_days,
    var.layer_arns.markdown_tools,
  ]
}
