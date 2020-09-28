{
    "intro": {
        "transformers": {
            "firstItem": {
                "helper": "processFirstItem",
                "params": {
                    "items": {
                        "ref": "event.items"
                    }
                }
            },
            "restItems": {
                "helper": "getRestItems",
                "params": {
                    "items": {
                        "ref": "event.items"
                    }
                }
            }
        }
    },
    "outro": {
        "dependencies": {
            "nextFunction": {
                "action": "invokeFunction",
                "conditions": {
                    "nonEmpty": [
                        {
                            "isNonEmptyList": "intro.vars.restItems"
                        }
                    ]
                },
                "params": {
                    "FunctionName": {
                        "ref": "context.invokedFunctionArn"
                    },
                    "Payload": {
                        "helper": "constructInvokePayload",
                        "params": {
                            "items": {
                                "ref": "intro.vars.restItems"
                            }
                        }
                    }
                }
            }
        }
    }
}
