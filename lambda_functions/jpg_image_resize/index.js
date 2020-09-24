const exploranda = require('exploranda-core');
const _ = require('lodash');

const apiConfig = {
  region: process.env.AWS_REGION
}

function dependencies({inputBucket, inputKey, resizedBucket, resizedPrefix, mediaId, widths}) {
  return {
    image: {
      accessSchema: exploranda.dataSources.AWS.s3.getObject,
      params: {
        Bucket: {value: inputBucket},
        Key: {value: inputKey}
      },
      formatter: (res) => _.map(res, (r) => r.Body)
    },
    rotate: {
      accessSchema: exploranda.dataSources.sharp.rotate.rotateOne,
      params: {
        image: {
          source: 'image',
          formatter: ({image}) => image[0]
        },
      }
    },
    resize: {
      accessSchema: exploranda.dataSources.sharp.resize.resizeOne,
      params: {
        image: {
          source: 'rotate',
          formatter: ({rotate}) => rotate[0]
        },
        width: {value: widths},
        withoutEnlargement: {value: true},
      }
    },
    save: {
      accessSchema: exploranda.dataSources.AWS.s3.putObject,
      params: {
        Bucket: {value: resizedBucket},
        Body: {
          source: 'resize',
          formatter: ({resize}) => resize
        },
        Key: {value: _.map(widths, (w) => `${(_.endsWith(resizedPrefix, '/') || !resizedPrefix) ? resizedPrefix : resizedPrefix + '/'}${mediaId}-${w}.JPG`)}
      }
    },
  };
}



exports.handler = function(event, context, callback) {
  console.error(JSON.stringify(event))
  const reporter = exploranda.Gopher(dependencies(event));

  reporter.report((e, n) => callback(e, _.get(n, 'save')));
}
