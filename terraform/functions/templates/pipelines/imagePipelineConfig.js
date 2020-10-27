module.exports = {
  stages: {
    intro: {
      index: 0,
      transformers: {
        mediaId: {
          or: [
            {ref: 'event.mediaId'},
            {helper: "uuid"},
          ]
        },
        bucket: {
          or: [
            {ref: 'event.bucket'},
            {ref: 'event.Records[0].s3.bucket.name'},
          ]
        },
        imageKey: {
          or: [
            {ref: 'event.imageKey'},
            {ref: 'event.Records[0].s3.object.key'},
          ]
        },
      },
      dependencies: {
        getImage: {
          action: 'getImageAutoRotated',
          params: {
            inputBucket: { ref: 'stage.bucket' },
            inputKey: { ref: 'stage.imageKey' },
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
            labeledMediaTable: { value: '${labeled_media_dynamo_table}' },
            mediaType: { value: 'IMAGE' },
            bucket: { ref: 'stage.bucket' },
            key: { ref: 'stage.imageKey' },
            mediaId: { ref: 'stage.mediaId' },
          }
        },
        publishImageWebSizes: {
          action: 'publishImageWebSizes',
          conditions: {
            shouldPublish: {
              or: [
                {
                  helper: 'isInList',
                  params: {
                    list: {value: ['${post_input_bucket_name}']},
                    item: { ref: 'stage.bucket' }
                  }
                },
                {ref: 'stage.publish'}
              ]
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
            mediaId: { ref: 'stage.mediaId' },
            widths: { value: [100, 300, 500, 750, 1000, 2500] },
          }
        },
      }
    },
  },
} 
