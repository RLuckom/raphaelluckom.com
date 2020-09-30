module.exports = {
    "intro": {
        "dependencies": {
            "addPartitions": {
                "action": "insertAthenaPartitions",
                "onditions": {
                    "nonEmpty": {
                        "ref": "event.exportConfigs"
                    }
                },
                "params": {
                    "athenaDb": {
                        "value": "${athena_db}"
                    },
                    "athenaResultBucket": {
                        "value": "${athena_result_bucket}"
                    },
                    "athenaTable": {
                        "value": "${athena_table}"
                    },
                    "dryRun": {
                        "value": true
                    },
                    "exportTask": {
                        "helper": "qualifiedDependencyName",
                        "params": {
                            "configStepName": {
                                "value": "logExports"
                            },
                            "dependencyName": {
                                "value": "exportTasks"
                            }
                        }
                    }
                }
            },
            "logExports": {
                "action": "prepareLogExports",
                "onditions": {
                    "nonEmpty": {
                        "ref": "event.exportConfigs"
                    }
                },
                "params": {
                    "logExportDestinationBucket": {
                        "value": "${log_export_destination_bucket}"
                    },
                    "partitionPrefix": {
                        "value": "${partition_prefix}"
                    },
                    "runId": {
                        "ref": "stage.runId"
                    }
                }
            }
        },
        "transformers": {
            "runId": {
                "helper": "uuid"
            }
        }
    },
    "outro": {
        "dependencies": {
            "nextFunction": {
                "action": "exploranda",
                "onditions": {
                    "moreExports": {
                        "helper": "isNonEmptyList",
                        "params": {
                            "list": {
                                "ref": "stage.remainingExports"
                            }
                        }
                    }
                },
                "params": {
                    "accessSchema": {
                        "value": "dataSources.AWS.lambda.invoke"
                    },
                    "dependencyName": {
                        "value": "nextFunction"
                    },
                    "dryRun": {
                        "value": true
                    },
                    "params": {
                        "value": {
                            "FunctionName": {
                                "all": {
                                    "value": {
                                        "ref": "context.invokedFunctionArn"
                                    }
                                }
                            },
                            "Payload": {
                                "all": {
                                    "value": {
                                        "ref": "stage.remainingExports"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "transformers": {
            "remainingExports": {
                "helper": "slice",
                "params": {
                    "list": {
                        "or": [
                            {
                                "ref": "event.exportConfigs"
                            },
                            {
                                "ref": "intro.results.logExports_exportTasks"
                            }
                        ]
                    },
                    "start": { value: 1 }
                }
            }
        }
    }
}
