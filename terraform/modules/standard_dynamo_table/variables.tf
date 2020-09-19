variable "table_name" {
  type = string
}


// stream items table vars

variable "range_key_name" {
  type = string
  default = ""
}

variable "ttl" {
  type = list(object({
    enabled = bool
    attribute_name = string
  }))
  default = []
}

variable "partition_key" {
  type = object({
    name = string
    type = string 
  })
  default = {
    name = "id"
    type = "S"
  }
}

variable "additional_keys" {
  type = list(object({
    name = string
    type = string 
  }))
  default = []
}

variable "replica_regions" {
  type = list(string)
  default = []
}