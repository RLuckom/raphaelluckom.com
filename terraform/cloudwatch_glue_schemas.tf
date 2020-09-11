locals {
  generic_cloudwatch_logs_schema = {
    partition_keys = [
      {
        name = "year"
        type = "string"
      },
      {
        name = "month"
        type = "string"
      },
      {
        name = "day"
        type = "string"
      },
      {
        name = "service"
        type = "string"
      },
      {
        name = "sourcename"
        type = "string"
      }
    ]

    columns = [
      {
        name = "ingesttime"
        type = "string"
      },
      {
        name = "logmessage"
        type = "string"
      }
    ]
  }
}
