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
  i18n_config_values = local.i18n_config_values
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
    connections = {
      css_paths = local.index_css_paths
      script_paths = local.index_script_paths
      deferred_script_paths = []
      render_config_path = "${path.module}/src/frontend/libs/connections.js"
    }
    feed = {
      css_paths = local.index_css_paths
      script_paths = local.index_script_paths
      deferred_script_paths = []
      render_config_path = "${path.module}/src/frontend/libs/feed.js"
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

locals {
  status_codes = {
    CONNECTED = "CONNECTED"
  }
}

module post_entry_lambda {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
  config_contents = templatefile("${path.module}/src/backend/post-entry/post_entry_config.js",
  {
    website_bucket = module.social_site.website_bucket_name
    table_name = module.posts_table.table_name
    table_region = var.region
    feed_item_kind = local.feed_item_kind
    size_key = local.size_key
    modified_time_key = local.modified_time_key
    notification_function_name = module.connection_notifier_lambda.lambda.function_name
    feed_item_partition_key = local.feed_item_partition_key
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
  additional_helpers = [
    {
      file_contents = file("${path.module}/src/backend/post-entry/packagePost.js")
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

module connections_table {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  unique_suffix = var.unique_suffix
  table_name = local.connections_table_name
  account_id = var.account_id
  region = var.region
  delete_item_permission_role_names = [
    var.plugin_config.authenticated_role.name,
  ]
  write_permission_role_names = [
    module.connection_request_function.role.name,
    module.connection_request_acceptance_function.role.name,
    module.connection_request_delivery_function.role.name,
    module.connection_test_delivery_function.role.name,
    module.connection_request_acceptance_delivery_function.role.name,
  ]
  read_permission_role_names = [
    module.social_access_control_function.role.name,
    var.plugin_config.authenticated_role.name,
    module.connection_notifier_lambda.role.name,
    module.connection_request_function.role.name,
    module.connection_request_acceptance_function.role.name,
  ]
  ttl = [{
    enabled = true
    attribute_name = local.connection_table_ttl_attribute
  }]
  global_indexes = [{
    name = local.domain_index_name
    hash_key = local.domain_key
    range_key = local.connection_state_key
    write_capacity = 0
    read_capacity = 0
    projection_type = "KEYS_ONLY"
    non_key_attributes = []
  },
  {
    name = local.state_index_name
    range_key = local.domain_key
    hash_key = local.connection_state_key
    write_capacity = 0
    read_capacity = 0
    projection_type = "KEYS_ONLY"
    non_key_attributes = []
  }]
  partition_key = {
    name = local.connection_type_key
    type = "S"
  }
  range_key = {
    name = local.domain_key
    type = "S"
  }
  additional_keys = [
    {
      name = local.connection_state_key
      type = "S"
    }
  ]
}

module connection_notifier_lambda {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  timeout_secs = 60
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
  invoking_roles = [
    module.post_entry_lambda.role.arn
  ]
  config_contents = templatefile("${path.module}/src/backend/connection_notifier/config.js",
  {
    connections_table_name = module.connections_table.table_name
    connections_table_region = var.region
    connection_table_state_key = local.connection_state_key
    connection_table_state_index = local.state_index_name
    connection_status_code_connected = local.connection_status_code_connected
    social_signing_private_key_bucket = var.plugin_config.bucket_name
    social_signing_private_key_s3_key = local.social_signing_private_key_s3_key
    social_domain = var.coordinator_data.routing.domain
    incoming_notification_api_path = local.incoming_notification_api_path
  })
  logging_config = var.logging_config
  additional_helpers = [
    {
      file_contents = file("${path.module}/src/backend/signRequests.js")
      helper_name = "signRequests"
    }
  ]
  lambda_event_configs = var.lambda_event_configs
  action_name = "notify_connections"
  scope_name = var.coordinator_data.system_id.security_scope
  donut_days_layer = var.donut_days_layer
  additional_layers = [
    var.node_jose_layer
  ]
}

module connection_request_delivery_function {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  timeout_secs = 60
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region

  invoking_roles = [
    var.plugin_config.authenticated_role.arn,
  ]
  config_contents = templatefile("${path.module}/src/backend/connection_request_delivery_functions/config.js",
  {
    set_timeout = true
    connections_table_name = module.connections_table.table_name
    connections_table_region = var.region
    connection_table_state_key = local.connection_state_key
    connection_status_code_pending = local.connection_status_code_pending
    connection_type_key = local.connection_type_key
    social_signing_private_key_bucket = var.plugin_config.bucket_name
    social_signing_private_key_s3_key = local.social_signing_private_key_s3_key
    social_domain = var.coordinator_data.routing.domain
    connection_request_type = local.connection_request_type
    feed_list_path = local.feed_list_api_path
    connection_type_initial = local.connection_type_initial
    connection_status_code = local.connection_status_code_pending
    domain_key = local.domain_key
    connection_table_ttl_attribute = local.connection_table_ttl_attribute
    connection_request_api_path = local.connection_request_api_path 
    intermediate_state_timeout_secs = local.intermediate_connection_state_timeout_secs
  })
  logging_config = var.logging_config
  additional_helpers = [
    {
      file_contents = file("${path.module}/src/backend/signRequests.js")
      helper_name = "signRequests"
    }
  ]
  lambda_event_configs = var.lambda_event_configs
  action_name = "connection_request_delivery"
  scope_name = var.coordinator_data.system_id.security_scope
  donut_days_layer = var.donut_days_layer
  additional_layers = [
    var.node_jose_layer
  ]
}

module connection_request_acceptance_delivery_function {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  timeout_secs = 60
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
  invoking_roles = [
    var.plugin_config.authenticated_role.arn,
  ]
  config_contents = templatefile("${path.module}/src/backend/connection_request_delivery_functions/config.js",
  {
    set_timeout = false
    connections_table_name = module.connections_table.table_name
    connections_table_region = var.region
    connection_table_state_key = local.connection_state_key
    connection_status_code_connected = local.connection_status_code_connected
    connection_type_key = local.connection_type_key
    social_signing_private_key_bucket = var.plugin_config.bucket_name
    social_signing_private_key_s3_key = local.social_signing_private_key_s3_key
    social_domain = var.coordinator_data.routing.domain
    connection_request_type = local.connection_request_acceptance_type
    feed_list_path = local.feed_list_api_path
    domain_key = local.domain_key
    connection_type_initial = local.connection_type_initial
    connection_status_code = local.connection_status_code_connected
    connection_table_ttl_attribute = local.connection_table_ttl_attribute
    connection_request_api_path = local.connection_request_acceptance_api_path 
    intermediate_state_timeout_secs = local.intermediate_connection_state_timeout_secs
  })
  logging_config = var.logging_config
  additional_helpers = [
    {
      file_contents = file("${path.module}/src/backend/signRequests.js")
      helper_name = "signRequests"
    }
  ]
  lambda_event_configs = var.lambda_event_configs
  action_name = "connection_request_acceptance_delivery"
  scope_name = var.coordinator_data.system_id.security_scope
  donut_days_layer = var.donut_days_layer
  additional_layers = [
    var.node_jose_layer
  ]
}

module connection_test_delivery_function {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  timeout_secs = 60
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
  invoking_roles = [
    var.plugin_config.authenticated_role.arn,
  ]
  config_contents = templatefile("${path.module}/src/backend/connection_test/config.js",
  {
    connections_table_name = module.connections_table.table_name
    connections_table_region = var.region
    connection_table_state_key = local.connection_state_key
    connection_status_code_connected = local.connection_status_code_connected
    connection_type_key = local.connection_type_key
    social_signing_private_key_bucket = var.plugin_config.bucket_name
    social_signing_private_key_s3_key = local.social_signing_private_key_s3_key
    social_domain = var.coordinator_data.routing.domain
    connection_request_type = local.connection_request_acceptance_type
    feed_list_path = local.feed_list_api_path
    domain_key = local.domain_key
    connection_type_initial = local.connection_type_initial
    connection_status_code_disconnected = local.connection_status_code_disconnected
    connection_status_code_connected = local.connection_status_code_connected
    connection_table_ttl_attribute = local.connection_table_ttl_attribute
    connection_test_api_path = local.connection_test_api_path 
    intermediate_state_timeout_secs = local.intermediate_connection_state_timeout_secs
  })
  logging_config = var.logging_config
  additional_helpers = [
    {
      file_contents = file("${path.module}/src/backend/signRequests.js")
      helper_name = "signRequests"
    }
  ]
  lambda_event_configs = var.lambda_event_configs
  action_name = "connection_test_delivery"
  scope_name = var.coordinator_data.system_id.security_scope
  donut_days_layer = var.donut_days_layer
  additional_layers = [
    var.node_jose_layer
  ]
}

module connection_item_table {
  source = "github.com/RLuckom/terraform_modules//aws/state/permissioned_dynamo_table"
  unique_suffix = var.unique_suffix
  table_name = local.connection_item_table_name
  account_id = var.account_id
  region = var.region
  delete_item_permission_role_names = [
  ]
  write_permission_role_names = [
    module.feed_item_collector_lambda.role.name
  ]
  read_permission_role_names = [
  ]
  partition_key = {
    name = local.feed_item_partition_key
    type = "S"
  }
  range_key = {
    name = local.modified_time_key
    type = "N"
  }
}

module feed_item_collector_lambda {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
  config_contents = templatefile("${path.module}/src/backend/feed_item_collector/config.js",
  {
    connection_item_table_name = module.connection_item_table.table_name
    connection_item_table_region = var.region
    connection_item_table_modified_key = local.modified_time_key
    connection_item_table_partition_key = local.feed_item_partition_key
    connection_item_table_kind = local.feed_item_kind
    connection_item_bucket = var.plugin_config.bucket_name
    connection_item_prefix = "${trimsuffix(var.plugin_config.backend_readwrite_root, "/")}/${local.connection_items_plugin_relative_prefix}/"
    request_timeout_secs = 4
    request_size_limit_mb = 2
  })
  logging_config = var.logging_config
  additional_helpers = [
    {
      file_contents = file("${path.module}/src/backend/feed_item_collector/streamWriter.js")
      helper_name = "streamWriter"
    }
  ]
  lambda_event_configs = var.lambda_event_configs
  action_name = "feed_item_collector"
  scope_name = var.coordinator_data.system_id.security_scope
  donut_days_layer = var.donut_days_layer
  additional_layers = [
  ]
}

module social_access_control_function {
  source = "github.com/RLuckom/terraform_modules//aws/self_contained_utility_functions/published_jwk_auth"
  unique_suffix = var.unique_suffix
  account_id = var.account_id
  security_scope = var.coordinator_data.system_id.security_scope
  log = "true"
  auth_config = {
    dynamo_region = var.region
    dynamo_table_name = module.connections_table.table_name
    dynamo_index_name = local.state_index_name
    domain = var.coordinator_data.routing.domain
    connection_state_connected = local.connection_status_code_connected
    connection_state_key = local.connection_state_key
  }
  bucket_config = {
    supplied = true
    credentials_file = ""
    bucket = var.plugin_config.bucket_name
    prefix = var.plugin_config.setup_storage_root
  }
}

module feed_list_endpoint {
  source = "github.com/RLuckom/terraform_modules//aws/donut_days_function"
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
  config_contents = templatefile("${path.module}/src/backend/feed-list-endpoint/config.js",
  {
    table_name = module.posts_table.table_name
    index_name = local.modified_time_index
    table_region = var.region
    partition_key = local.feed_item_partition_key
    modified_time_key = local.modified_time_key
    modified_time_index = local.modified_time_index
    max_lookback_seconds = local.max_lookback_seconds
    feed_item_kind = local.feed_item_kind
  })
  logging_config = var.logging_config
  lambda_event_configs = var.lambda_event_configs
  action_name = "feed_list"
  scope_name = var.coordinator_data.system_id.security_scope
  donut_days_layer = var.donut_days_layer
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
    module.feed_list_endpoint.role.name,
    var.plugin_config.authenticated_role.name,
  ]
  partition_key = {
    name = local.feed_item_partition_key
    type = "S"
  }
  range_key = {
    name = local.feed_item_id_key
    type = "S"
  }
  global_indexes = [{
    name = local.modified_time_index
    hash_key = local.feed_item_partition_key
    range_key = local.modified_time_key
    write_capacity = 0
    read_capacity = 0
    projection_type = "INCLUDE"
    non_key_attributes = ["presignedUrl", "size"]
  }]
  additional_keys = [
    {
      name = local.modified_time_key
      type = "N"
    }
  ]
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
    command = "ls; pwd; cd ${path.module}/src/setup && ls && export npm_config_cache=. && npm install && node ./index.js && aws s3 cp ./private.json s3://${var.plugin_config.bucket_name}/${local.social_signing_private_key_s3_key} --content-type=\"application/jwk+json\" && aws s3 cp ./public.json s3://${module.social_site.website_bucket_name}/${local.jwk_s3_path} --content-type=\"appication/jwk+json\"; rm ./public.json; rm ./private.json" 
    node_script = file("${path.module}/src/setup/index.js")
  }

  provisioner "local-exec" {
    # Bootstrap script called with private_ip of each node in the clutser
    command = "ls; pwd; cd ${path.module}/src/setup && ls && export npm_config_cache=. && npm install && node ./index.js && aws s3 cp ./private.json s3://${var.plugin_config.bucket_name}/${local.social_signing_private_key_s3_key} --content-type=\"application/jwk+json\" && aws s3 cp ./public.json s3://${module.social_site.website_bucket_name}/${local.jwk_s3_path} --content-type=\"appication/jwk+json\"; rm ./public.json; rm ./private.json" 
    environment = {
      AWS_SHARED_CREDENTIALS_FILE = var.aws_credentials_file
    }
  }
}

resource "aws_s3_bucket_object" "connection_canary" {
  bucket = module.social_site.website_bucket_name
  key    = local.connection_test_api_path
  content_type = "text/plain"
  content = "Success"
}

module connection_request_acceptance_function {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  source_contents = [
    {
      file_name = "index.js"
      file_contents = templatefile("${path.module}/src/backend/connection_request_acceptance/index.js",
      {
        connection_type_key = local.connection_type_key
        connection_type_initial = local.connection_type_initial
        key_timeout_secs = 2
        intermediate_connection_state_timeout_secs = local.intermediate_connection_state_timeout_secs
        connection_request_type = local.connection_request_acceptance_type
        domain_key = local.domain_key
        dynamo_region = var.region
        dynamo_table_name = module.connections_table.table_name
        domain = var.coordinator_data.routing.domain
        log = true
        domain_index = local.domain_index_name
        connection_status_code_pending = local.connection_status_code_pending
        connection_table_state_key = local.connection_state_key
        connection_status_code_connected = local.connection_status_code_connected
      })
    }
  ]
  lambda_details = {
    action_name = "connection_request_acceptance"
    scope_name = var.coordinator_data.system_id.security_scope
    policy_statements = []
  }
  layers = [
    var.donut_days_layer,
    var.node_jose_layer,
  ]
  lambda_event_configs = var.lambda_event_configs
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
}

module connection_request_function {
  source = "github.com/RLuckom/terraform_modules//aws/permissioned_lambda"
  source_contents = [
    {
      file_name = "index.js"
      file_contents = templatefile("${path.module}/src/backend/connection_request/index.js",
      {
        connection_type_key = local.connection_type_key
        connection_type_initial = local.connection_type_initial
        key_timeout_secs = 2
        intermediate_connection_state_timeout_secs = local.intermediate_connection_state_timeout_secs
        domain_key = local.domain_key
        connection_request_type = local.connection_request_type
        dynamo_region = var.region
        dynamo_table_name = module.connections_table.table_name
        domain = var.coordinator_data.routing.domain
        log = true
        domain_index = local.domain_index_name
        connection_table_state_index = local.state_index_name
        connection_table_state_key = local.connection_state_key
        connection_status_code_our_response_requested = local.connection_status_code_our_response_requested
        connection_table_ttl_attribute = local.connection_table_ttl_attribute
      })
    }
  ]
  layers = [
    var.donut_days_layer,
    var.node_jose_layer,
  ]
  lambda_details = {
    action_name = "connection_request"
    scope_name = var.coordinator_data.system_id.security_scope
    policy_statements = []
  }
  lambda_event_configs = var.lambda_event_configs
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
}

module social_site {
  source = "github.com/RLuckom/terraform_modules//aws/serverless_site/capstan"
  account_id = var.account_id
  unique_suffix = var.unique_suffix
  region = var.region
  coordinator_data = var.coordinator_data
  force_destroy = var.allow_delete_buckets
  lambda_origins = [
    {
      path = local.connection_request_api_path
      lambda = {
        arn = module.connection_request_function.lambda.arn
        name = module.connection_request_function.lambda.function_name
      }
      authorizer = "NONE"
      gateway_name_stem = "default"
      allowed_methods = ["HEAD", "GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"]
      cached_methods = ["HEAD", "GET"]
      compress = true
      ttls = {
        min = 0
        default = 0
        max = 0
      }
      forwarded_values = {
        # usually true
        query_string = false
        # usually empty list
        query_string_cache_keys = []
        # probably best left to empty list; that way headers used for
        # auth can't be leaked by insecure functions. If there's
        # a reason to want certain headers, go ahead.
        headers = ["Microburin-Signature"]
        # same as headers; should generally be empty
        cookie_names = []
      }
    },
    {
      path = local.connection_request_acceptance_api_path
      lambda = {
        arn = module.connection_request_acceptance_function.lambda.arn
        name = module.connection_request_acceptance_function.lambda.function_name
      }
      authorizer = "NONE"
      gateway_name_stem = "default"
      allowed_methods = ["HEAD", "GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"]
      cached_methods = ["HEAD", "GET"]
      compress = true
      ttls = {
        min = 0
        default = 0
        max = 0
      }
      forwarded_values = {
        # usually true
        query_string = false
        # usually empty list
        query_string_cache_keys = []
        # probably best left to empty list; that way headers used for
        # auth can't be leaked by insecure functions. If there's
        # a reason to want certain headers, go ahead.
        headers = ["Microburin-Signature"]
        # same as headers; should generally be empty
        cookie_names = []
      }
    },
    {
      # a value of "NONE" will let the function
      # handle its own access control. A 
      # value of "CLOUDFRONT_DISTRIBUTION" will
      # use the lambda authorizers provided;
      # this is also the default if there are 
      # no lambda authorizers. Any other value uses
      # the lambda authorizers provided.
      authorizer = "CLOUDFRONT_DISTRIBUTION"
      # unitary path denoting the function's endpoint, e.g.
      # "/meta/relations/trails"
      path = local.feed_list_api_path
      # Usually all lambdas in a dist should share one gateway, so the gway
      # name stems should be the same across all lambda endpoints.
      # But if you wanted multiple apigateways within a single dist., you
      # could set multiple name stems and the lambdas would get allocated
      # to different gateways
      gateway_name_stem = "default"
      allowed_methods = ["HEAD", "GET"]
      cached_methods = ["HEAD", "GET"]
      compress = true
      ttls = {
        min = 200
        default = 200
        max = 200
      }
      forwarded_values = {
        # usually true
        query_string = false
        # usually empty list
        query_string_cache_keys = []
        # probably best left to empty list; that way headers used for
        # auth can't be leaked by insecure functions. If there's
        # a reason to want certain headers, go ahead.
        headers = []
        # same as headers; should generally be empty
        cookie_names = []
      }
      lambda = {
        arn = module.feed_list_endpoint.lambda.arn
        name = module.feed_list_endpoint.lambda.function_name
      }
    },
    {
      # a value of "NONE" will let the function
      # handle its own access control. A 
      # value of "CLOUDFRONT_DISTRIBUTION" will
      # use the lambda authorizers provided;
      # this is also the default if there are 
      # no lambda authorizers. Any other value uses
      # the lambda authorizers provided.
      authorizer = "CLOUDFRONT_DISTRIBUTION"
      # unitary path denoting the function's endpoint, e.g.
      # "/meta/relations/trails"
      path = local.incoming_notification_api_path
      # Usually all lambdas in a dist should share one gateway, so the gway
      # name stems should be the same across all lambda endpoints.
      # But if you wanted multiple apigateways within a single dist., you
      # could set multiple name stems and the lambdas would get allocated
      # to different gateways
      gateway_name_stem = "default"
      allowed_methods = ["HEAD", "DELETE", "PATCH", "GET", "PUT", "POST", "OPTIONS"]
      cached_methods = ["HEAD", "GET"]
      compress = true
      ttls = {
        min = 0
        default = 0
        max = 0
      }
      forwarded_values = {
        # usually true
        query_string = false
        # usually empty list
        query_string_cache_keys = []
        headers = ["Microburin-Signature"]
        cookie_names = []
      }
      lambda = {
        arn = module.feed_item_collector_lambda.lambda.arn
        name = module.feed_item_collector_lambda.lambda.function_name
      }
    },
  ]
  no_access_control_s3_path_patterns = [{
    path = local.jwk_s3_path
  }]
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
  access_control_function_qualified_arns = [module.social_access_control_function.access_control_function_qualified_arns]
  access_control_function_include_body = {
    refresh_auth = false
    parse_auth = false
    check_auth = true
    sign_out = false
    http_headers = false
    move_cookie_to_auth_header = false
  }
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
