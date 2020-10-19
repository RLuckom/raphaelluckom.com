const { exploranda } = require('donut-days');
const _ = require('lodash'); 
const crypto = require('crypto')

const ExifReader = require('exifreader');

function sha1(buf) {
  const hash = crypto.createHash('sha1');
  hash.update(buf)
  return hash.digest('hex')
}

function getImageAutoRotated({inputBucket, inputKey}, addDependency, addResourceReference, getDependencyName, processParams, processParamValue, addFullfilledResource, transformers) {
  const image = addDependency('image', {
    accessSchema: exploranda.dataSources.AWS.s3.getObject,
    params: {
      Bucket: {value: inputBucket},
      Key: {value: inputKey}
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
  })
  const autoRotatedImage = addDependency('autoRotatedImage', {
    accessSchema: exploranda.dataSources.sharp.rotate.rotateOne,
    params: {
      image: {
        source: image,
        formatter: (params) => params[image][0].image
      },
    }
  })
}

function publishImageWebSizes({autoRotatedImageDependencyName, publicHostingBucket, publicHostingPrefix, mediaId, widths}, addDependency, addResourceReference, getDependencyName, processParams, processParamValue, addFullfilledResource, transformers) {
  const resize = addDependency('resize', {
    accessSchema: exploranda.dataSources.sharp.resize.resizeOne,
    params: {
      image: {
        source: autoRotatedImageDependencyName,
        formatter: (params) => params[autoRotatedImageDependencyName][0]
      },
      width: {value: widths},
      withoutEnlargement: {value: true},
    }
  })
  const fulfilledResource = {
    bucket: publicHostingBucket,
    key: _.map(widths, (w) => `${(_.endsWith(publicHostingPrefix, '/') || !publicHostingPrefix) ? publicHostingPrefix : publicHostingPrefix + '/'}${mediaId}-${w}.JPG`)
  }
  const save = addDependency('save',  {
    accessSchema: exploranda.dataSources.AWS.s3.putObject,
    params: {
      Bucket: {value: fulfilledResource.bucket},
      Body: {
        source: resize,
        formatter: (params) => params[resize]
      },
      Key: {value: fulfilledResource.key }
    }
  })
  addFullfilledResource(fulfilledResource)
}

function archiveImage({imageMetaDependencyName, autoRotatedImageDependencyName, mediaStorageBucket, mediaStoragePrefix, mediaDynamoTable, labeledMediaTable, mediaType, bucket, key, mediaId}, addDependency, addResourceReference, getDependencyName, processParams, processParamValue, addFullfilledResource, transformers) {
  const apiConfig = {
    region: process.env.AWS_REGION
  }
  const textDepName = addDependency('text', {
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
  })
  const facesDepName = addDependency('faces', {
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
  })
  const labelsDepName = addDependency('labels', {
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
  })
  const dynamoRecord = addDependency('dynamoRecord', {
    accessSchema: {
      dataSource: 'SYNTHETIC',
      value: { path: _.identity},
      transformation: ({meta}) => {
        return meta
      }
    },
    params: {
      meta: {
        source: [textDepName, labelsDepName, facesDepName, imageMetaDependencyName, autoRotatedImageDependencyName],
        formatter: (params) => {
          const text = params[textDepName]
          const labels = params[labelsDepName]
          const faces = params[facesDepName]
          const imageMeta = params[imageMetaDependencyName]
          const rotate = params[autoRotatedImageDependencyName]
          const {year, month, day, hour} = imageMeta[0].date
          const asSavedHash = sha1(rotate[0])
          const mediakey = `${mediaStoragePrefix ? mediaStoragePrefix + '/' : ""}${mediaId}.JPG`
          const record = {...{
            id: mediaId,
            type: mediaType,
            format: key.split('.').pop(),
            time: imageMeta[0].meta.timestamp,
            mediabucket: mediaStorageBucket,
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
  })
  const archivedImage = {
    bucket: mediaStorageBucket,
    key: `${mediaStoragePrefix ? mediaStoragePrefix + '/' : ""}${mediaId}.JPG`
  }
  const save = addDependency('save', {
    accessSchema: exploranda.dataSources.AWS.s3.putObject,
    params: {
      Bucket: {
        value: archivedImage.bucket
      },
      Body: {
        source: autoRotatedImageDependencyName,
        formatter: (params) => {
          return params[autoRotatedImageDependencyName][0]
        },
      },
      Key: {
        source: dynamoRecord,
        formatter: (params) => archivedImage.key
      },
    }
  })
  addFullfilledResource(archivedImage)
  const dynamoItem = {
    table: mediaDynamoTable,
    id: mediaId
  }
  const dynamo = addDependency('dynamo', {
    accessSchema: exploranda.dataSources.AWS.dynamodb.putItem,
    params: {
      apiConfig: {value: apiConfig},
      TableName: {
        value: mediaDynamoTable
      },
      Item: {
        source: dynamoRecord,
        formatter: (params) => params[dynamoRecord][0]
      }
    }
  })
  addFullfilledResource(dynamoItem)
  const dynamoLabelRecords = addDependency('dynamoLabelRecords', {
    accessSchema: exploranda.dataSources.AWS.dynamodb.putItem,
    params: {
      apiConfig: {value: apiConfig},
      TableName: {
        value: labeledMediaTable
      },
      Item: {
        source: dynamoRecord,
        formatter: (params) => _.map(params[dynamoRecord][0].labels, (label) => {
          return {
            mediaId,
            mediaType,
            label: label.Name
          }
        })
      }
    }
  })
  const tagForCleanup = addDependency('tagForCleanup', {
    accessSchema: exploranda.dataSources.AWS.s3.putObjectTagging,
    params: {
      Bucket: {
        value: bucket
      },
      Key: {
        value: key
      },
      Tagging: {
        source: [save, dynamo],
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
  })
}

module.exports = {
  archiveImage,
  getImageAutoRotated,
  publishImageWebSizes,
}
