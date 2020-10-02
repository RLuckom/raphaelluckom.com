#!/bin/bash
set -e
node index.js
zip -r lambda.zip .
aws s3 cp lambda.zip s3://rluckom.lambda/log_export/lambda.zip
cd ../../terraform && terraform taint module.log_export_lambda.aws_lambda_function.lambda
