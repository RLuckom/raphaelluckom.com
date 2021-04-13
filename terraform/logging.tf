module visibility_system {
  source = "github.com/RLuckom/terraform_modules//aws/visibility/aurochs"
  supported_systems = [
    {
      security_scope = "test"
      subsystem_names = ["test"]
    }, {
      security_scope = "prod"
      subsystem_names = ["prod", "media", "human"]
    }
  ]
  scoped_logging_functions = {
    prod = {
      prod = module.prod_site.lambda_logging_roles
      human = concat(module.human_attention_archive.lambda_logging_roles, [module.upload_img.role.arn])
    }
    test = {}
  }
  glue_permission_name_map = {
    prod = {
      raphaelluckom_com = {
        add_partition_permission_names = []
        add_partition_permission_arns = []
        query_permission_names = [module.cognito_identity_management.authenticated_role["athena"].name]
        query_permission_arns = [module.cognito_identity_management.authenticated_role["athena"].arn]
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
    test_admin = {
      system_id = {
        security_scope = "test"
        subsystem_name = "admin"
      }
      domain_parts = {
        top_level_domain = "com"
        controlled_domain_part = "admin.raphaelluckom"
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
  cloudfront_delivery_bucket_name = "${var.bucket_prefix}-visibility-data"
  visibility_bucket_name = "${var.bucket_prefix}-visibility-data"
  media_output_bucket_name = "rluckom.photos.partition"
  media_storage_config = {
    bucket = local.media_output_bucket_name
    prefix = ""
    debug = false
  }
  media_site_cloudfront_logging_config = {
    bucket = local.visibility_bucket_name
    prefix = "media.raphaelluckom"
    include_cookies = false
  }
}
