resource "aws_dynamodb_table" "standard_table" {
  name             = var.table_name
  hash_key         = var.partition_key.name
  billing_mode     = "PAY_PER_REQUEST"
  stream_enabled   = false
  range_key      = var.range_key_name != "" ? var.range_key_name : var.ttl.attribute_name

  dynamic "ttl" {
    for_each = var.ttl == "" ? [] : [var.ttl]
    content {
      enabled = var.ttl.enabled
      attribute_name = var.ttl.attribute_name
    }
  }

  dynamic "attribute" {
    for_each = concat([var.partition_key], var.range_key_name != "" ? [{name = var.range_key_name, type="N"}] : [], var.additional_keys)

    content {
      name               = attribute.value.name
      type               = attribute.value.type
    }
  }

  dynamic "attribute" {
    for_each = var.ttl == "" ? [] : [var.ttl] 

    content {
      name               = var.ttl.attribute_name
      type               = "N" // ttl key must be number
    }
  }

  dynamic "replica" {
    for_each = var.replica_regions

    content {
      region_name               = replica
    }
  }
}
