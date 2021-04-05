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
        widths: { value: [500] },
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
          action: 'image.getImageAutoRotated',
          params: {
            inputBucket: { ref: 'stage.bucket' },
            inputKey: { ref: 'stage.imageKey' },
          }
        },
        publishImageWebSizes: {
          action: 'image.publishImageWebSizes',
          params: {
            autoRotatedImageDependencyName: { 
              helper: 'qualifiedDependencyName',
              params: {
                configStepName: { value: 'getImage' },
                dependencyName: { value: 'autoRotatedImage' },
              },
            },
            hostingBucket: { value: '${media_hosting_bucket}' },
            hostingPrefix: { value: '${media_storage_prefix}' },
            mediaId: { ref: 'stage.mediaId' },
            widths: { ref: 'stage.widths' },
          }
        },
      }
    }
  }
}
