module visibility_system {
  source = "github.com/RLuckom/terraform_modules//aws/visibility/aurochs"
  supported_systems = [
    {
      security_scope = "test"
      subsystem_names = ["test"]
    }, {
      security_scope = "prod"
      subsystem_names = ["prod", "media"]
    }
  ]
  scoped_logging_functions = {
    prod = {
      prod = module.prod_site.lambda_logging_prefix_role_map
    }
    test = {}
  }
  scoped_athena_query_roles = {
    prod = {
      "security_scope=prod/subsystem=prod/source=cloudfront/domain=raphaelluckom.com/"  = [module.cognito_identity_management.authenticated_role.arn]
    }
  }
  glue_permission_name_map = {
    prod = {
      raphaelluckom_com = {
        add_partition_permission_names = []
        query_permission_names = [module.cognito_identity_management.authenticated_role.name]
      }
    }
  }
  cloudfront_delivery_bucket = "${var.bucket_prefix}-cloudfront-delivery"
  visibility_data_bucket = "${var.bucket_prefix}-visibility-data"
  lambda_source_bucket = aws_s3_bucket.lambda_bucket.id
  donut_days_layer = module.donut_days.layer_config
  lambda_event_configs = local.notify_failure_only
  serverless_site_configs = {
    prod = {
      system_id = {
        security_scope = "prod"
        subsystem_name = "prod"
      }
      domain_parts = {
        top_level_domain = "com"
        controlled_domain_part = "raphaelluckom"
      }
    }
    test = {
      system_id = {
        security_scope = "test"
        subsystem_name = "test"
      }
      domain_parts = {
        top_level_domain = "com"
        controlled_domain_part = "test.raphaelluckom"
      }
    }
    cognito = {
      system_id = {
        security_scope = "test"
        subsystem_name = "cognito"
      }
      domain_parts = {
        top_level_domain = "com"
        controlled_domain_part = "testcog.raphaelluckom"
      }
    }
    media = {
      system_id = {
        security_scope = "prod"
        subsystem_name = "media"
      }
      domain_parts = {
        top_level_domain = "com"
        controlled_domain_part = "media.raphaelluckom"
      }
    }
  }
}

locals {
  athena_bucket_name = var.athena_bucket_name
  cloudfront_delivery_bucket_name = "${var.bucket_prefix}-visibility-data"
  visibility_bucket_name = "${var.bucket_prefix}-visibility-data"
  media_output_bucket_name = "rluckom.photos.partition"
  media_storage_config = {
    bucket = local.media_output_bucket_name
    prefix = ""
    debug = false
  }
  media_storage_policy = {
    prefix = local.media_storage_config.prefix
    actions = ["s3:PutObject"]
    principals = [
      {
        type = "AWS"
        identifiers = [
          module.image_archive_lambda.role.arn,
        ]
      }
    ]
  }
  media_site_cloudfront_logging_config = {
    bucket = local.visibility_bucket_name
    prefix = "media.raphaelluckom"
    include_cookies = false
  }
}
