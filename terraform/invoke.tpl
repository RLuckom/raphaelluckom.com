{
    "intro": {
        "dependencies": {
            "firstItem": {
                "action": "storeItem",
                "params": {
                    "item": {
                        "helper": "processFirstItem",
                        "params": {
                            "items": {
                                "ref": "stage.items"
                            }
                        }
                    }
                }
            },
            "restItems": {
                "action": "storeItem",
                "params": {
                    "item": {
                        "helper": "getRestItems",
                        "params": {
                            "items": {
                                "ref": "stage.items"
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
                        "event.items": "items"
                    }
                }
            ]
        }
    },
    "outro": {
        "dependencies": {
            "nextFunction": {
                "action": "invokeFunction",
                "conditions": {
                    "nonEmpty": [
                        {
                            "isNonEmptyList": "stage.restItems"
                        }
                    ]
                },
                "params": {
                    "FunctionName": {
                        "ref": "stage.function"
                    },
                    "Payload": {
                        "helper": "constructInvokePayload",
                        "params": {
                            "items": {
                                "ref": "stage.restItems"
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
                        "intro.results.firstItem_stored[0]": "firstItem"
                    }
                },
                {
                    "copy": {
                        "context.invokedFunctionArn": "function"
                    }
                },
                {
                    "copy": {
                        "intro.results.restItems_stored": "restItems"
                    }
                }
            ]
        }
    }
}
