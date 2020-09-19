{
  "JPG" : {
    "suffixes": [".JPG", ".JPEG", ".jpg", ".jpeg"],
    "functionInvocations": [
      {
        "functionArn": "${jpg_processor_arn}",
        "eventSchema": {
            "bucket": "$bucket",
            "key": "$key",
            "mediaId": "$mediaId"
         }
      }
    ]
  }
}
