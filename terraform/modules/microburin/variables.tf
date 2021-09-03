variable name {
  type = string
}

variable region {
  type = string
}

variable account_id {
  type = string
}

variable allow_delete_buckets {
  type = bool
  default = false
}

variable unique_suffix {
  type = string
  default = ""
}

variable aws_credentials_file {
  type = string
  default = "/.aws/credentials"
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
    setup_storage_root = string
    backend_readonly_root = string
    backend_readwrite_root = string
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

locals {
  i18n_config_values = {
    postMetadata =  {
      placeholders = {
        trails = "Trails (comma-separated)"
        author = "Author"
        title = "Title"
        footnoteTitle = "Footnote Title"
        id = "Type a new post id, then press Enter"
      }
    }
    saveState = {
      unmodified = "Unmodified"
      unsaved = "Unsaved"
      modified = "Changed"
    }
    publishState = {
      mostRecent = "Published"
      unpublished = "Unpublished"
      modified = "Changed"
      unknown = "Unknown"
    }
    postActions = {
      unpublish = "Unpublish"
      publish = "Publish"
      save = "Save"
      edit = "Edit"
      delete = "Delete"
      toIndex = "Back"
      new = "New Post"
      addFootnote = "Add Footnote"
    }
    connectionHeaders = {
      domain = "Connected Domain"
      connectionStatus = "Connection Status"
      connectionType = "Connection Type"
    }
    connectionStates = {
      CONNECTED = {
        code = local.connection_status_code_connected
        message = "Connected"
        transitions = [
          {
            nextState = local.connection_status_code_disconnected
            transitionMethod = "testConnection"
            message = "Test Connection"
          },
          {
            nextState = null
            transitionMethod = "deleteConnection"
            message = "Delete Connection"
          }
        ]
      }
      DISCONNECTED = {
        code = local.connection_status_code_disconnected
        message = "Connection Broken"
        transitions = [
          {
            nextState = local.connection_status_code_disconnected
            transitionMethod = "testConnection"
            message = "Test Connection"
          },
          {
            nextState = null
            transitionMethod = "deleteConnection"
            message = "Delete Connection"
          }
        ]
      }
      PENDING_RESPONSE = {
        code = local.connection_status_code_pending
        message = "Request Sent"
        transitions = [
          {
            nextState = local.connection_status_code_disconnected
            transitionMethod = "testConnection"
            message = "Test Connection"
          },
          {
            nextState = null
            transitionMethod = "deleteConnection"
            message = "Delete Connection"
          }
        ]
      }
      OUR_RESPONSE_REQUESTED = {
        code = local.connection_status_code_our_response_requested
        message = "Request Received"
        transitions = [
          {
            nextState = local.connection_status_code_connected
            transitionMethod = "acceptConnectionRequest"
            message = "Accept Connection"
          },
          {
            nextState = null
            transitionMethod = "deleteConnection"
            message = "Delete Connection"
          },
          {
            nextState = local.connection_status_code_disconnected
            transitionMethod = "testConnection"
            message = "Test Connection"
          },
        ]
      }
    }
    editActions = {
      deleteFootnote = "Delete Footnote"
      reallyDeleteFootnote = "Confirm Delete"
    }
    editing = "Editing"
    ui = {
      colonMarker = ":"
      textDescription = "Text Description"
      deselect = "Deselect"
      ok = "OK"
      cancel = "Cancel"
      required = "Required"
      createLink = "Create a link"
      linkTarget = "Link Target"
      toggleStrong = "Toggle stromg style"
      toggleEmphasis = "Toggle emphasis style"
      toggleCode = "Toggle code font"
      wrapBullet = "Wrap in bullet list"
      wrapOrdered = "Wrap in ordered list"
      wrapBlock = "Wrap in blockquote"
      changeParagraph = "Change to paragraph"
      plain = "Plain"
      changeCode = "Change to code block"
      code = "Code"
      changeHeading = "Change to Heading"
      level = "Level"
      insertHr = "Insert horizontal rule"
      hr = "Horizontal rule"
      addFnText = "Add footnote text"
      fnText = "Footnote text"
      fnRef = "Footnote Ref"
      insert = "Insert"
      heading = "Heading"
      type = "Type"
      ellipsis = "..."
      insertFn = "Insert Footnote"
      fn = "Footnote"
      insertImage = "Insert image"
      image = "Image"
      file = "File"
    }
  }
}

// plugin-specific variables below this line

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
    metric_table = string
    site_metrics_table = string
    lambda_log_delivery_prefix = string
    lambda_log_delivery_bucket = string
    cloudfront_log_delivery_prefix = string
    cloudfront_log_delivery_bucket = string
  })
}

variable subject_alternative_names {
  type = list(string)
  default = []
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

variable node_jose_layer {
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

variable archive_utils_layer {
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
    metric_table = string
  })
  default = {
    bucket = ""
    prefix = ""
    metric_table = ""
  }
}

locals {
  connection_state_key = "connectionState"
  connection_type_key = "connectionType"
  connection_type_initial = "INITIAL"
  posts_table_name = "${var.coordinator_data.system_id.security_scope}-${var.coordinator_data.system_id.subsystem_name}-microburin_table-${random_id.table_suffix.b64_url}"
  connections_table_name = "${var.coordinator_data.system_id.security_scope}-${var.coordinator_data.system_id.subsystem_name}-connections_table-${random_id.table_suffix.b64_url}"
  modified_time_key = "modifiedTime"
  domain_key = "domain"
  size_key = "size"
  feed_item_id_key = "postId"
  connection_status_code_connected = "CONNECTION_ESTABLISHED"
  connection_status_code_disconnected = "CONNECTION_BROKEN"
  connection_status_code_pending = "CONNECTION_PENDING_RESPONSE"
  connection_status_code_our_response_requested = "CONNECTION_OUR_RESPONSE_REQUESTED"
  connection_request_type = "CONNECTION_REQUEST"
  connection_request_acceptance_type = "CONNECTION_REQUEST_ACCEPTED"
  intermediate_connection_state_timeout_secs = 60 * 60 * 24 * 14
  modified_time_index = "modified"
  feed_item_partition_key = "kind"
  feed_item_kind = "feedItem"
  domain_index_name = "domainIndex"
  state_index_name = "stateIndex"
  connection_table_ttl_attribute = "requestExpires"
  max_lookback_seconds = 60 * 60 * 24 * 31
  blog_image_hosting_root = "/img/"
  blog_image_hosting_prefix = "img/"
  blog_post_hosting_root = "/posts/"
  blog_post_hosting_prefix = "posts/"
  connection_item_table_name = "connection_items"
  plugin_image_hosting_prefix = "${var.plugin_config.hosting_root}img/"
  plugin_post_hosting_prefix = "${var.plugin_config.hosting_root}posts/"
  file_prefix = trim(var.plugin_config.source_root, "/")
  social_signing_key_plugin_relative_prefix = "private-social-key"
  connection_items_plugin_relative_prefix = "connection-feed-items"
  jwk_s3_path = ".well-known/microburin-social/keys/social-signing-public-key.jwk"
  feed_list_api_path = ".well-known/microburin-social/api/private/feed-items"
  incoming_notification_api_path = ".well-known/microburin-social/api/private/incoming-notifications"
  connection_request_api_path = ".well-known/microburin-social/api/public/connection-request"
  connection_request_acceptance_api_path = ".well-known/microburin-social/api/public/connection-response"
  connection_test_api_path = ".well-known/microburin-social/api/private/connection_canary"
  social_signing_key_plugin_relative = "${local.social_signing_key_plugin_relative_prefix}/key.jwk"
  social_signing_private_key_s3_key = "${var.plugin_config.backend_readonly_root}${local.social_signing_key_plugin_relative}"
  edit_styles_path = "${local.file_prefix}/assets/styles/editor.css"
  plugin_default_styles_path = "${local.file_prefix}/assets/styles/default.css"
  post_utils_js_path = "${local.file_prefix}/assets/js/post-utils-${filemd5("${path.module}/src/frontend/libs/post_utils.js")}.js"
  libs_js_path = "${local.file_prefix}/assets/js/pkg-${filemd5("${path.module}/src/frontend/libs/libs.js")}.js"
  prosemirror_setup_js_path = "${local.file_prefix}/assets/js/prosemirror-setup-${filemd5("${path.module}/src/frontend/libs/prosemirror-setup.js")}.js"
  plugin_config = {
    posts_table = module.posts_table.table_name
    site_metrics_table = var.coordinator_data.site_metrics_table
    table_region = var.region
    connection_domain_key = local.domain_key
    website_bucket = module.social_site.website_bucket_name
    blog_image_hosting_root = local.blog_image_hosting_root
    blog_image_hosting_prefix = local.blog_image_hosting_prefix
    blog_post_hosting_root = local.blog_post_hosting_root
    blog_post_hosting_prefix = local.blog_post_hosting_prefix
    operator_name = var.maintainer.name
    connection_type_initial = local.connection_type_initial
    connection_type_key = local.connection_type_key
    connection_test_function_name = module.connection_test_delivery_function.lambda.function_name
    connection_request_acceptance_function_name = module.connection_request_acceptance_delivery_function.lambda.function_name
    connection_request_function_name = module.connection_request_delivery_function.lambda.function_name
    plugin_image_upload_path = "${trimsuffix(var.plugin_config.upload_root, "/")}/img/"
    plugin_post_upload_path = "${trimsuffix(var.plugin_config.upload_root, "/")}/posts/"
    plugin_image_hosting_path = "${trimsuffix(var.plugin_config.hosting_root, "/")}/img/"
    plugin_post_hosting_path = "${trimsuffix(var.plugin_config.hosting_root, "/")}/posts/"
    plugin_image_hosting_prefix = local.plugin_image_hosting_prefix
    plugin_post_hosting_prefix = local.plugin_post_hosting_prefix
    connections_table_name = module.connections_table.table_name
  }
  default_css_paths = [
    var.admin_site_resources.default_styles_path,
    local.plugin_default_styles_path,
  ]
  index_css_paths = [
  ]
  edit_css_paths = [
    local.edit_styles_path
  ]
  default_deferred_script_paths = [
    var.admin_site_resources.default_scripts_path,
  ]
  default_script_paths = [
    local.libs_js_path,
    local.post_utils_js_path,
  ]
  index_script_paths = [
  ]
  edit_script_paths = [
    local.prosemirror_setup_js_path,
  ]
}

output files {
  value = module.ui.files 
}

output plugin_running_material {
  value = {
    name = var.name
    slug = "manage blog posts"
  }
}
