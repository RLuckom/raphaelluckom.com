{
    "intro": {
        "dependencies": {
            "mediaId": {
                "action": "storeItem",
                "params": {
                    "item": {
                        "ref": "mediaId"
                    }
                }
            }
        },
        "transformers": {
            "mediaId": [
                {
                    "uuid": [
                        "mediaId"
                    ]
                }
            ]
        }
    },
    "outro": {
        "dependencies": {
            "nextFunction": {
                "action": "invokeFunction",
                "params": {
                    "FunctionName": {
                        "value": "${function_name}"
                    },
                    "Payload": {
                        "helper": "constructInvokePayload",
                        "params": {
                            "Bucket": {
                                "ref": "bucket"
                            },
                            "Key": {
                                "ref": "key"
                            },
                            "mediaId": {
                                "ref": "mediaId"
                            }
                        }
                    }
                }
            }
        },
        "transformers": {
            "parameters": [
                {
                    "copy": {
                        "intro.mediaId_stored[0]": "mediaId"
                    }
                },
                {
                    "copy": {
                        "event.bucket": "bucket"
                    }
                },
                {
                    "copy": {
                        "event.key": "key"
                    }
                }
            ]
        }
    }
}
