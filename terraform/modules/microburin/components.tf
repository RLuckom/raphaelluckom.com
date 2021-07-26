resource "random_id" "table_suffix" {
  byte_length = 3
}

module ui {
  source = "github.com/RLuckom/terraform_modules//themes/icknield/admin_site_plugin_ui"
  name = var.name
  region = var.region
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  gopher_config_contents = file("${path.module}/src/frontend/libs/gopher_config.js")
  admin_site_resources = var.admin_site_resources
  plugin_config = var.plugin_config
  config_values = local.plugin_config
  i18n_config_values = var.i18n_config_values
  default_css_paths = local.default_css_paths
  default_script_paths = local.default_script_paths
  default_deferred_script_paths = []
  page_configs = {
    index = {
      css_paths = local.index_css_paths
      script_paths = local.index_script_paths
      deferred_script_paths = []
      render_config_path = "${path.module}/src/frontend/libs/index.js"
    }
    edit = {
      css_paths = local.edit_css_paths
      script_paths = local.edit_script_paths
      deferred_script_paths = []
      render_config_path = "${path.module}/src/frontend/libs/edit.js"
    }
  }
  plugin_file_configs = [
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
      key = local.post_utils_js_path
      file_contents = null
      file_path = "${path.module}/src/frontend/libs/post_utils.js"
      content_type = "application/javascript"
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
  ]
}

module post_entry_lambda {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
  config_contents = templatefile("${path.module}/src/backend/post_entry_config.js",
  {
    website_bucket = module.social_site.website_bucket_name
    table_name = module.posts_table.table_name
    table_region = var.region
    plugin_image_hosting_prefix = local.plugin_image_hosting_prefix
    plugin_post_hosting_prefix = local.plugin_post_hosting_prefix 
    plugin_image_hosting_root = "https://${var.plugin_config.domain}/${var.plugin_config.hosting_root}img/"
    blog_image_hosting_root = local.blog_image_hosting_root
    blog_image_hosting_prefix = local.blog_image_hosting_prefix
    blog_post_hosting_root = local.blog_post_hosting_root
    blog_post_hosting_prefix = local.blog_post_hosting_prefix
    plugin_post_upload_prefix = "${var.plugin_config.upload_root}posts/"
    plugin_post_hosting_root = "https://${var.plugin_config.domain}/${var.plugin_config.hosting_root}posts/"
  })
  logging_config = var.logging_config
  invoking_roles = [
    var.plugin_config.authenticated_role.arn
  ]
  additional_helpers = [
    {
      file_contents = file("${path.module}/src/backend/packagePost.js")
      helper_name = "packagePost"
    }
  ]
  lambda_event_configs = var.lambda_event_configs
  action_name = "feed_entry"
  scope_name = var.coordinator_data.system_id.security_scope
  donut_days_layer = var.donut_days_layer
  additional_layers = [
    var.markdown_tools_layer,
    var.archive_utils_layer
  ]
}

module posts_table {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  unique_suffix = var.unique_suffix
  table_name = local.posts_table_name
  account_id = var.account_id
  region = var.region
  delete_item_permission_role_names = [module.post_entry_lambda.role.name]
  write_permission_role_names = [module.post_entry_lambda.role.name]
  read_permission_role_names = [
    module.post_entry_lambda.role.name,
    var.plugin_config.authenticated_role.name,
  ]
  partition_key = {
    name = "kind"
    type = "S"
  }
  range_key = {
    name = "id"
    type = "S"
  }
}

module friends_table {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  unique_suffix = var.unique_suffix
  table_name = local.friends_table_name
  account_id = var.account_id
  region = var.region
  delete_item_permission_role_names = [
  ]
  write_permission_role_names = [
  ]
  read_permission_role_names = [
  ]
  partition_key = {
    name = "state"
    type = "S"
  }
  range_key = {
    name = "url"
    type = "S"
  }
}

module process_image_uploads {
  source = "github.com/RLuckom/terraform_modules//aws/utility_functions/image_upload_processor"
  account_id = var.account_id
  action_name = "feed_img_proc"
  unique_suffix = var.unique_suffix
  region = var.region
  logging_config = var.logging_config
  lambda_event_configs = var.lambda_event_configs
  security_scope = var.coordinator_data.system_id.security_scope
  image_layer = var.image_layer
  donut_days_layer = var.donut_days_layer
  io_config = {
    input_bucket = var.plugin_config.bucket_name
    input_path = local.plugin_config.plugin_image_upload_path
    output_bucket = var.plugin_config.bucket_name
    output_path = local.plugin_config.plugin_image_hosting_path
    key_length = 2
    tags = []
  }
}

resource null_resource social_key {

  # Changes to any instance of the cluster requires re-provisioning
  triggers = {
    refresh = false
  }

  provisioner "local-exec" {
    # Bootstrap script called with private_ip of each node in the clutser
    command = "ls; pwd; cd ${path.module}/src/setup && ls && export npm_config_cache=. && npm install && node ./index.js && aws s3 cp ./private.json s3://${var.plugin_config.bucket_name}/${var.plugin_config.backend_readonly_root}private-social-key.jwk --content-type=\"application/jwk+json\" && aws s3 cp ./public.json s3://${module.social_site.website_bucket_name}/.well-known/microburin-social/keys/social-signing-public-key.jwk --content-type=\"appication/jwk+json\"; rm ./public.json; rm ./private.json" 
    environment = {
      AWS_SHARED_CREDENTIALS_FILE = var.aws_credentials_file
    }
  }
}

module social_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/capstan"
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
  coordinator_data = var.coordinator_data
  force_destroy = var.allow_delete_buckets
  website_bucket_cors_rules = [{
    allowed_headers = ["authorization", "content-md5", "content-type", "cache-control", "x-amz-content-sha256", "x-amz-date", "x-amz-security-token", "x-amz-user-agent"]
    allowed_methods = ["GET"]
    allowed_origins = ["https://${var.plugin_config.domain}"]
    expose_headers = ["ETag"]
    max_age_seconds = 3000
  }]
  website_bucket_prefix_object_permissions = [
    {
      permission_type = "put_object"
      prefix = "posts/"
      arns = [module.post_entry_lambda.role.arn]
    },
    {
      permission_type = "read_and_tag_known"
      prefix = "posts/"
      arns = [module.post_entry_lambda.role.arn]
    },
    {
      permission_type = "delete_object"
      prefix = "posts/"
      arns = [module.post_entry_lambda.role.arn]
    },
    {
      permission_type = "put_object"
      prefix = "img/"
      arns = [module.post_entry_lambda.role.arn]
    },
    {
      permission_type = "delete_object"
      prefix = "img/"
      arns = [module.post_entry_lambda.role.arn]
    },
  ]
  website_bucket_bucket_permissions = [
    {
      permission_type = "list_bucket"
      arns = [
        module.post_entry_lambda.role.arn,
        var.plugin_config.authenticated_role.arn,
      ]
    }
  ]
  subject_alternative_names = var.subject_alternative_names
}
