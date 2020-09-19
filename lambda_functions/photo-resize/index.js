const exploranda = require('exploranda-core');
const _ = require('lodash');
const ExifReader = require('exifreader');
const zlib = require('zlib')

// Bucket for partitioned files, e.g. 'rluckom.timeseries'
const PARTITION_BUCKET = process.env.PARTITION_BUCKET
// prefix in bucket for partitioned files, e.g. 'partitioned/raphaelluckom.com'
const PARTITION_PREFIX = process.env.PARTITION_PREFIX

// Bucket for partitioned files, e.g. 'rluckom.timeseries'
const METADATA_PARTITION_BUCKET = process.env.METADATA_PARTITION_BUCKET
// prefix in bucket for partitioned files, e.g. 'partitioned/raphaelluckom.com'
const METADATA_PARTITION_PREFIX = process.env.METADATA_PARTITION_PREFIX
// bucket in which to store Athena results with prefix, e.g. 's3://rluckom.athena'.
// seems to not work if it's a folder.
const ATHENA_RESULT_BUCKET = process.env.ATHENA_RESULT_BUCKET
// database in Athena / Glue to query, e.g. 'timeseries'
const ATHENA_DB = process.env.ATHENA_DB
// table in Athena / Glue to query, e.g. 'raphaelluckom_cf_logs_partitioned_gz'
const ATHENA_TABLE = process.env.ATHENA_TABLE
// catalog to use in Athena. For most queries this will be 'AwsDataCatalog'
const ATHENA_CATALOG = process.env.ATHENA_CATALOG || 'AwsDataCatalog'
const ATHENA_REGION = process.env.ATHENA_REGION

const apiConfig = {
  region: ATHENA_REGION
}

function safeString(n) {
  try {
    const original = _.reduce(n, (a, v, k) => {
      a[k] = _.get(v, 'value')
      return a
    }, {})
    return JSON.stringify(original)
  } catch(e) {
    try {
      return JSON.stringify(n)
    } catch (err) {
      console.log(err)
      return null
    }
  }
}

function dependencies(bucket, key) {
  const metaKey = `${key.match(/[^.]+/g)[0]}_meta.gz`
  return {
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
            file: safeString(meta.file),
            exif: safeString(meta.exif),
            xmp: safeString(meta.xmp),
            iptc: safeString(meta.iptc),
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
    resize: {
      accessSchema: exploranda.dataSources.sharp.resize.resizeOne,
      params: {
        image: {
          source: 'rotate',
          formatter: ({rotate}) => {
            return rotate[0]
          }
        },
        width: {value: [100, 300, 500, 750, 1000, 2500]},
        withoutEnlargement: {value: true},
      }
    },
    save:{
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Bucket: {value: 'rluckom.scratch'},
        Body: {
          source: 'resize',
          formatter: ({resize}) => resize
        },
        Key: {value: ['100.jpg', '300.jpg', '500.jpg', '750.jpg', '1000.jpg', '2500.jpg']}
      }
    },
    /*
    copy: {
      accessSchema: exploranda.dataSources.AWS.s3.copyObject,
      params: {
        Bucket: {
          value: PARTITION_BUCKET
        },
        CopySource: {
          value: `/${bucket}/${key}`,
        },
        Key: {
          source: 'imageMeta',
          formatter: ({imageMeta}) => {
            const {year, month, day, hour} = imageMeta[0].date
            return `${PARTITION_PREFIX ? PARTITION_PREFIX + '/' : ""}year=${year}/month=${month}/day=${day}/hour=${hour}/${key}`
          }
        },
      },
    },
    delete: {
      accessSchema: exploranda.dataSources.AWS.s3.deleteObject,
      params: {
        Bucket: {
          value: bucket
        },
        Key: {
          source: ['copy'],
          formatter: () => key
        }
      },
    }
   */
  };
}

exports.handler = function(event, context, callback) {
  //const key = _.get(event, 'Records[0].s3.object.key', 'photos/2020-03-18/DSC_0653.JPG')
  //const key = _.get(event, 'Records[0].s3.object.key', 'ashjackplane/IMG_6020.JPG')
  //const key = _.get(event, 'Records[0].s3.object.key', 'IMG_6821.JPG')
  //const key = _.get(event, 'Records[0].s3.object.key', 'IMG_6826.JPG')
  const key = _.get(event, 'Records[0].s3.object.key', 'IMG_6831.JPG')
  const bucket = _.get(event, 'Records[0].s3.bucket.name', 'rluckom-photo-archive')
  //const key = _.get(event, 'Records[0].s3.object.key')
  //const bucket = _.get(event, 'Records[0].s3.bucket.name')
  const reporter = exploranda.Gopher(dependencies(bucket, key));
  reporter.report((e, n) => callback(e, n));
}

exports.handler({}, {}, (e, r) => {
  console.log(e)
  console.log(r)
})
