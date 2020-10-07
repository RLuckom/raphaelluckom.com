module.exports = {
  overrides: {
    MAX_RECURSION_DEPTH: 20
  },
  "intro": {
    "dependencies": {
      "addPartitions": {
        "action": "insertAthenaPartitions",
        "conditions": {
          "nonEmpty": {not: {"ref": "event.exportConfigs"}}
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
        "conditions": {
          "nonEmpty": {not: {"ref": "event.exportConfigs"}}
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
  main: {
    "dependencies": {
      "performExport": {
        "action": "performExport",
        "params": {
          exportTask: {ref: "stage.allExports[0]"}
        }
      },
    },
    "transformers": {
      "allExports": {
        "or": [
          {
            "ref": "event.exportConfigs"
          },
          {
            "ref": "intro.results.logExports_exportTasks"
          }
        ]
      },
    }
  },
  "outro": {
    "dependencies": {
      "nextFunction": {
        "conditions": {
          "moreExports": {
            "helper": "isNonEmptyList",
            "params": {
              "list": {
                "ref": "stage.remainingExports"
              }
            }
          }
        },
        "action": "recurse",
        "params": {
          "Payload": {
            all: {
              exportConfigs: {ref: "stage.remainingExports"}
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
      },
    }
  }
}