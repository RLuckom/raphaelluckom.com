module.exports = {
  intro: {
    dependencies: {
      nextFunction: {
        action: 'DD',
        params: {
          FunctionName: {value: '${test_function}'},
          event: {
            all: {
              mediaId: { ref: 'stage.mediaId' },
              bucket: { value: 'rluckom-media-input' },
              imageKey: { value: 'IMG_7161-1600502954.JPG' }
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
              },
              imageMetadata: {
                all: {
                  table: {value: "${media_dynamo_table}" },
                  id: {ref: 'stage.mediaId' }
                }
              },
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
