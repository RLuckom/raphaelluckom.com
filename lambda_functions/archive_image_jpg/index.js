const exploranda = require('exploranda-core');
const _ = require('lodash');
const ExifReader = require('exifreader');
const zlib = require('zlib')
const crypto = require('crypto')
const uuid = require('uuid')

// Bucket for partitioned files, e.g. 'rluckom.timeseries'
const MEDIA_STORAGE_BUCKET = process.env.MEDIA_STORAGE_BUCKET
// prefix in bucket for partitioned files, e.g. 'partitioned/raphaelluckom.com'
const MEDIA_STORAGE_PREFIX = process.env.MEDIA_STORAGE_PREFIX

// Bucket for partitioned files, e.g. 'rluckom.timeseries'
const MEDIA_METADATA_TABLE_BUCKET = process.env.MEDIA_METADATA_TABLE_BUCKET
// prefix in bucket for partitioned files, e.g. 'partitioned/raphaelluckom.com'
const MEDIA_METADATA_TABLE_PREFIX = process.env.MEDIA_METADATA_TABLE_PREFIX
// DynamoDB table in which media is stored
const MEDIA_DYNAMO_TABLE = process.env.MEDIA_DYNAMO_TABLE
// Media type
const MEDIA_TYPE = process.env.MEDIA_TYPE
const AWS_REGION = process.env.AWS_REGION

const apiConfig = {
  region: AWS_REGION
}

function sha1(buf) {
  const hash = crypto.createHash('sha1');
  hash.update(buf)
  return hash.digest('hex')
}

function dependencies(bucket, key, mediaId) {
  return {
    text: {
      accessSchema: exploranda.dataSources.AWS.rekognition.detectText,
      params: {
        apiConfig: {value: apiConfig},
        Image: {
          value: {
            S3Object: {
              Bucket: bucket,
              Name: key,
            }
          }
        }
      },
      formatter: (res) => {
        return {
          strings: _.map(res, 'DetectedText'),
          detail: res
        }
      }
    },
    faces: {
      accessSchema: exploranda.dataSources.AWS.rekognition.detectFaces,
      params: {
        apiConfig: {value: apiConfig},
        Attributes: {value: ['ALL']},
        Image: {
          value: {
            S3Object: {
              Bucket: bucket,
              Name: key,
            }
          }
        }
      },
      formatter: (res) => {
        return {
          number: res.length,
          emotions: _.map(res, 'Emotions'),
          detail: res
        }
      }
    },
    labels: {
      accessSchema: exploranda.dataSources.AWS.rekognition.detectLabels,
      params: {
        apiConfig: {value: apiConfig},
        Image: {
          value: {
            S3Object: {
              Bucket: bucket,
              Name: key,
            }
          }
        }
      },
      formatter: (res) => {
        return {
          labels: _.uniq(_.flatten(_.map(res, (r) => _.flatten([[r.Name], _.map(r.Parents, 'Name')])))),
            detail: res
        }
      }
    },
    imageMeta: {
      accessSchema: exploranda.dataSources.AWS.s3.getObject,
      params: {
        Bucket: {value: bucket},
        Key: {value: key}
      },
      formatter: (res) => _.map(res, (r) => {
        const meta = ExifReader.load(r.Body, {expanded: true})
        let date
        try {
          const year = meta.exif.DateTimeOriginal.description.slice(0, 4)
          const month = meta.exif.DateTimeOriginal.description.slice(5, 7)
          const day = meta.exif.DateTimeOriginal.description.slice(8, 10)
          const hour = meta.exif.DateTimeOriginal.description.slice(11, 13)
          const minute = meta.exif.DateTimeOriginal.description.slice(14, 16)
          const second = meta.exif.DateTimeOriginal.description.slice(17, 19)
          date = {year, month, day, hour, minute, second}
        } catch(e) {
          const now = new Date()
          date = {
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getUTCDate(),
            hour: now.getUTCHours(),
            minute: now.getUTCMinutes(),
            second: now.getUTCSeconds(),
          }
        }
        if (_.get(meta, 'exif.MakerNote')) {
          delete meta.exif.MakerNote
        }
        const ret = {
          image: r.Body,
          meta: {
            file: meta.file,
            exif: meta.exif,
            xmp: meta.xmp,
            iptc: meta.iptc,
            // I think the gps is getters not data so it doesn't json nicely
            gps: meta.gps ? {
              Latitude: meta.gps.Latitude,
              Longitude: meta.gps.Longitude,
              Altitude: meta.gps.Altitude,
            } : null,
            timestamp: `${date.year}-${date.month}-${date.day} ${date.hour}:${date.minute}:${date.second}.000` ,
          },
          date
        };
        return ret
      })
    },
    rotate: {
      accessSchema: exploranda.dataSources.sharp.rotate.rotateOne,
      params: {
        image: {
          source: 'imageMeta',
          formatter: ({imageMeta}) => {
            return imageMeta[0].image
          }
        },
      }
    },
    save:{
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Bucket: {
          value: MEDIA_STORAGE_BUCKET
        },
        Body: {
          source: 'rotate',
          formatter: ({rotate}) => rotate
        },
        Key: {
          source: 'dynamoRecord',
          formatter: ({dynamoRecord}) => dynamoRecord[0].mediakey
        },
      }
    },
    dynamoRecord: {
      accessSchema: {
        dataSource: 'SYNTHETIC',
        value: { path: _.identity},
        transformation: ({meta}) => {
          return meta
        }
      },
      params: {
        meta: {
          source: ['text', 'labels', 'faces', 'imageMeta', 'rotate'],
          formatter: ({text, labels, faces, imageMeta, rotate}) => {
            const {year, month, day, hour} = imageMeta[0].date
            const asSavedHash = sha1(rotate[0])
            const mediakey = `${MEDIA_STORAGE_PREFIX ? MEDIA_STORAGE_PREFIX + '/' : ""}${mediaId}.JPG`
            const record = {...{
              id: mediaId,
              type: MEDIA_TYPE,
              format: key.split('.').pop(),
              time: imageMeta[0].meta.timestamp,
              mediabucket: MEDIA_STORAGE_BUCKET,
              mediakey,
              originalHash: sha1(imageMeta[0].image),
              asSavedHash,
              faces: faces.number,
              emotions: faces.emotions,
              strings: text.strings,
              labels: labels.labels,
              gps: imageMeta[0].meta.gps,
              timestamp: imageMeta[0].meta.timestamp,
              text: text.detail,
              labels: labels.detail,
              faces: faces.detail,
            }, ...imageMeta[0].meta}
            return record
          }
        },
      }
    },
    dynamo: {
      accessSchema: exploranda.dataSources.AWS.dynamodb.putItem,
      params: {
        apiConfig: {value: apiConfig},
        TableName: {
          value: MEDIA_DYNAMO_TABLE
        },
        Item: {
          source: 'dynamoRecord',
          formatter: ({dynamoRecord}) => dynamoRecord
        }
      }
    },
    tagForCleanup: {
      accessSchema: exploranda.dataSources.AWS.s3.putObjectTagging,
      params: {
        Bucket: {
          value: bucket
        },
        Key: {
          value: key
        },
        Tagging: {
          source: ['save', 'dynamo'],
          formatter: () => {
            return {
              TagSet: [{
                Key: "processed",
                Value: "true"
              }]
            }
          }
        }
      },
    }
  };
}

exports.handler = function(event, context, callback) {
  const {key, bucket, mediaId} = event
  const reporter = exploranda.Gopher(dependencies(bucket, key, mediaId));
  reporter.report((e, n) => callback(e, n.dynamoRecord));
}
