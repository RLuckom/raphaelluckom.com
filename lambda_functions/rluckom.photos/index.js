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
// bucket in which to store Athena results with prefix, e.g. 's3://rluckom.athena'.
// seems to not work if it's a folder.
const ATHENA_RESULT_BUCKET = process.env.ATHENA_RESULT_BUCKET
// DynamoDB table in which media is stored
const MEDIA_DYNAMO_TABLE = process.env.MEDIA_DYNAMO_TABLE
// Media type
const MEDIA_TYPE = process.env.MEDIA_TYPE
// database in Athena / Glue to query, e.g. 'timeseries'
const ATHENA_DB = process.env.ATHENA_DB
// table in Athena / Glue to query, e.g. 'raphaelluckom_cf_logs_partitioned_gz'
const ATHENA_TABLE = process.env.ATHENA_TABLE
// catalog to use in Athena. For most queries this will be 'AwsDataCatalog'
const ATHENA_CATALOG = process.env.ATHENA_CATALOG || 'AwsDataCatalog'
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
    addPartitions: {
      accessSchema: exploranda.dataSources.AWS.athena.startQueryExecution,
      params: {
        apiConfig: {value: apiConfig},
        QueryString: {
          source: 'imageMeta',
          formatter : ({imageMeta}) => {
            const {year, month, day, hour} = imageMeta[0].date

            return `ALTER TABLE ${ATHENA_DB}.${ATHENA_TABLE}
            ADD IF NOT EXISTS 
            PARTITION (
              year = '${year}',
              month = '${month}',
              day = '${day}',
              hour = '${hour}' );`
          }
        },
        QueryExecutionContext: {
          value: {
            Catalog: ATHENA_CATALOG,
            Database: ATHENA_DB,
          }
        },
        ResultConfiguration: {
          value: {
            OutputLocation: `s3://${ATHENA_RESULT_BUCKET}`,
          }
        }
      }
    },
    waitForPartitions: {
      accessSchema: exploranda.dataSources.AWS.athena.getQueryExecution,
      params: {
        apiConfig: {value: apiConfig},
        QueryExecutionId: {
          source: 'addPartitions',
          formatter: ({addPartitions}) => addPartitions
        }
      },
      behaviors: {
        retryParams: {
          times: 60,
          interval: 10000,
          errorFilter: (err) => {
            return (err === 'QUEUED' || err === 'RUNNING')
          }
        },
        detectErrors: (err, res) => {
          status = _.get(res, 'QueryExecution.Status.State')
          if (status !== 'SUCCEEDED') {
            if (process.env.EXPLORANDA_DEBUG) {
              console.log(err)
            }
            return status
          }
        }
      }
    },
    partitionResults: {
      accessSchema: exploranda.dataSources.AWS.athena.getQueryResults,
      params: {
        apiConfig: {value: apiConfig},
        QueryExecutionId: {
          source: 'waitForPartitions',
          formatter: ({waitForPartitions}) => {
            return _.map(waitForPartitions, 'QueryExecutionId')
          }
        }
      },
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
          source: 'finalMeta',
          formatter: ({finalMeta}) => finalMeta[0].mediakey
        },
      }
    },
    saveMeta: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Bucket: {
          value: MEDIA_METADATA_TABLE_BUCKET
        },
        Key: {
          source: 'finalMeta',
          formatter: ({finalMeta}) => finalMeta[0].key
        },
        Body: {
          source:'finalMeta',
          formatter: ({finalMeta}) => {
            const meta = finalMeta[0]
            meta.imagemeta = JSON.stringify(meta.imageMeta)
            return zlib.gzipSync(JSON.stringify(meta) + '\n')
          }
        },
      },
    },
    finalMeta: {
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
            const mediakey = `${MEDIA_STORAGE_PREFIX ? MEDIA_STORAGE_PREFIX + '/' : ""}${mediaId}.${key.split('.').pop()}`
            const metadataKey = `${MEDIA_METADATA_TABLE_PREFIX ? MEDIA_METADATA_TABLE_PREFIX + '/' : ""}year=${year}/month=${month}/day=${day}/hour=${hour}/${mediaId}.meta.gz`
            const record = {
              mediaId,
              format: key.split('.').pop(),
              time: imageMeta[0].meta.timestamp,
              mediabucket: MEDIA_STORAGE_BUCKET,
              mediakey,
              bucket: MEDIA_METADATA_TABLE_BUCKET,
              key: metadataKey,
              originalHash: sha1(imageMeta[0].image),
              asSavedHash,
              gps: imageMeta[0].meta.gps,
              metadata: {
                faces: faces.number,
                emotions: faces.emotions,
                strings: text.strings,
                labels: labels.labels,
                gps: imageMeta[0].meta.gps,
                timestamp: imageMeta[0].meta.timestamp,
                bucket: MEDIA_METADATA_TABLE_BUCKET,
                key,
                mediabucket: MEDIA_STORAGE_BUCKET,
                mediakey,
              },
              text: text.detail,
              labels: labels.detail,
              faces: faces.detail,
              imagemeta: imageMeta[0].meta,
            }
            if (_.get(imageMeta, '[0].meta.gps')) {
              record.gps = _.get(imageMeta, '[0].meta.gps')
            }
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
          source: 'finalMeta',
          formatter: ({finalMeta}) => {
            return {
              id: mediaId,
              type: MEDIA_TYPE,
              metadata: finalMeta
            }
          }
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
          source: ['save', 'dynamo', 'partitionResults', 'saveMeta'],
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
  reporter.report((e, n) => callback(e, n.finalMeta));
}
