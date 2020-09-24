{
  "JPG" : {
    "matches": [{
      "suffixes": [".JPG", ".JPEG", ".jpg", ".jpeg"]
    }],
    "functionInvocations": [{
      "functionArn": "${jpg_processor_arn}",
      "eventSchema": {
        "bucket": "$bucket",
        "key": "$key",
        "mediaId": "$mediaId"
      }
    }]
  },
  "JPG-RESIZE" : {
    "matches": [{
      "suffixes": [".JPG", ".JPEG", ".jpg", ".jpeg"],
      "buckets": ["${post_input_bucket_name}"]
    }],
    "functionInvocations": [{
      "functionArn": "${jpg_resizer_arn}",
      "eventSchema": {
        "inputBucket": "$bucket",
        "inputKey": "$key",
        "resizedBucket": "${public_media_bucket_name}",
        "resizedPrefix": "img",
        "widths": [100, 300, 500, 750, 1000, 2500],
        "mediaId": "$mediaId"
      }
    }]
  }
}
