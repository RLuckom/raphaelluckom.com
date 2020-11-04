const { slackMethods } = require('./utils')
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
        widths: { value: [100, 300, 500, 750, 1000, 2500] },
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
          condition: {
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
            widths: { ref: 'stage.widths' },
          }
        },
        parameterStore: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.parameterstore.getParameter'},
            params: {
              explorandaParams: {
                Name: "${slack_credentials_parameterstore_key}" ,
                WithDecryption: true ,
              }
            }
          },
        },
        postImageToSlack: {
          action: 'exploranda',
          condition: {
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
          },
          params: {
            accessSchema: { value: slackMethods.postMessage },
            params: {
              explorandaParams: {
                apiConfig: {
                  source: ['parameterStore', 'publishImageWebSizes_save'],
                  formatter: ({parameterStore}) => {
                    console.log(parameterStore.Value)
                    return {token: JSON.parse(parameterStore.Value).token }
                  }
                },
                channel: 'app_testing',
                blocks: { 
                  helper: 'transform',
                  params: {
                    arg: {
                      all: {
                        bucket: { value: '${media_hosting_bucket}' },
                        mediaId: { ref: 'stage.mediaId' },
                      }
                    },
                    func: {
                      value: ({ bucket, mediaId }) => {
                        return JSON.stringify([
                        {
                          "type": "image",
                          "title": {
                            "type": "plain_text",
                            "text":  mediaId
                          },
                          "block_id": "image4",
                            "image_url": "https://media.raphaelluckom.com/images/" + mediaId + '-300.JPG',
                          "alt_text": "image"
                        },
                        ])
                      }
                    },
                  }
                }
              }
            },
          },
        },
        postPostTemplateToSlack: {
          action: 'exploranda',
          condition: {
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
          },
          params: {
            accessSchema: { value: slackMethods.postMessage },
            params: {
              explorandaParams: {
                apiConfig: {
                  source: ['parameterStore', 'publishImageWebSizes_save'],
                  formatter: ({parameterStore}) => {
                    console.log(parameterStore.Value)
                    return {token: JSON.parse(parameterStore.Value).token }
                  }
                },
                channel: 'app_testing',
                blocks: { 
                  helper: 'transform',
                  params: {
                    arg: {
                      all: {
                        mediaId: { ref: 'stage.mediaId' },
                      }
                    },
                    func: {
                      value: ({ mediaId }) => {
                        return JSON.stringify([
                          {
                            "type": "section",
                            "text": {
                              "type": "mrkdwn",
                              "text": '```' + JSON.stringify( {itemType: 'image', mediaId, alt: "", caption: "", timeAddedMs: new Date().getTime()}) +  '```'
                            }
                          }
                        ])
                      }
                    },
                  }
                }
              }
            },
          },
        }
      }
    },
  },
} 
