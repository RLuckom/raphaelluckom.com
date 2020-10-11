module.exports = {
  intro: {
    dependencies: {
      nextFunction: {
        action: 'eventConfiguredInvocation',
        params: {
          FunctionName: {value: '${test_function}'},
          config: {
            value: {
              intro: {
                dependencies: {
                  getImage: {
                    action: 'getImageAutoRotated',
                    params: {
                      inputBucket: { ref: 'event.bucket' },
                      inputKey: { ref: 'event.imageKey' },
                    }
                  },
                  archiveImage: {
                    action: 'archiveImage',
                    params: {
                      imageMetaDependencyName: { 
                        helper: 'qualifiedDependencyName',
                        params: {
                          configStepName: { value: 'getImage' },
                          dependencyName: { value: 'image' },
                        },
                      },
                      autoRotatedImageDependencyName: { 
                        helper: 'qualifiedDependencyName',
                        params: {
                          configStepName: { value: 'getImage' },
                          dependencyName: { value: 'autoRotatedImage' },
                        },
                      },
                      mediaStorageBucket: { value: '${media_storage_bucket}' },
                      mediaStoragePrefix: { value: '${media_storage_prefix}' },
                      mediaDynamoTable: { value: '${media_dynamo_table}' },
                      mediaType: { value: 'IMAGE' },
                      bucket: { value: '${photo_input_bucket}' },
                      key: { ref: 'event.imageKey' },
                      mediaId: { ref: 'event.mediaId' },
                    }
                  },
                  publishImageWebSizes: {
                    action: 'publishImageWebSizes',
                    conditions: {
                      shouldPublish: {
                        helper: 'isInList',
                        params: {
                          list: {value: ['rluckom-media-input']},
                          item: { ref: 'event.bucket' }
                        }
                      }
                    },
                    params: {
                      autoRotatedImageDependencyName: { 
                        helper: 'qualifiedDependencyName',
                        params: {
                          configStepName: { value: 'getImage' },
                          dependencyName: { value: 'autoRotatedImage' },
                        },
                      },
                      publicHostingBucket: { value: '${media_hosting_bucket}' },
                      publicHostingPrefix: { value: '${media_storage_prefix}' },
                      mediaId: { ref: 'event.mediaId' },
                      widths: { value: [100, 200, 400, 700, 1000, 1500] },
                    }
                  },
                }
              },
              main: {
              },
              outro: {
              },
            }
          },
          payloadValues: {
            all: {
              mediaId: { ref: 'stage.mediaId' },
              bucket: { value: 'rluckom-media-input' },
              imageKey: { value: 'IMG_7171.JPG' }
            }
          },
          resourceReferences: {
            value: 
              {
              resizedImage: {
                all: {
                  bucket: {value: '${media_hosting_bucket}' },
                  key: {
                    helper: 'mapTemplate',
                    params: {
                      templateString: {value: "${media_storage_prefix}/<%= mediaId %>-<%= size %>.JPG"},
                      templateArgumentsArray: { value: [
                        {all: { mediaId: {ref: 'stage.mediaId'}, size: {value: 100} }},
                        {all: { mediaId: {ref: 'stage.mediaId'}, size: {value: 200} }},
                        {all: { mediaId: {ref: 'stage.mediaId'}, size: {value: 400} }},
                        {all: { mediaId: {ref: 'stage.mediaId'}, size: {value: 700} }},
                        {all: { mediaId: {ref: 'stage.mediaId'}, size: {value: 1000} }},
                        {all: { mediaId: {ref: 'stage.mediaId'}, size: {value: 1500} }},
                      ] }
                    }
                  }
                }
              }
            }
          }
        }
      },
    },
    transformers: {
      mediaId: {
        helper: "uuid",
      }
    }
  },
  main: {},
  outro: {},
}
