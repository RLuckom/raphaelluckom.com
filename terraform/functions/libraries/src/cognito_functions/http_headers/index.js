/*
layers:
  - cognito_utils
tests: ../../../spec/src/cognito_functions/http_headers/index.spec.js
*/
// based on https://github.com/aws-samples/cloudfront-authorization-at-edge/blob/c99f34185384b47cfb2273730dbcd380de492d12/src/lambda-edge/http-headers/index.ts
const { getConfig } = require("../shared/shared")

let CONFIG

const handler = async (event) => {
  if (!CONFIG) {
    CONFIG = getConfig();
    CONFIG.logger.debug("Configuration loaded:", CONFIG);
  }
  CONFIG.logger.debug("Event:", event);
  const response = event.Records[0].cf.response;
  Object.assign(response.headers, CONFIG.cloudFrontHeaders);
  CONFIG.logger.debug("Returning response:\n", response);
  return response;
};
