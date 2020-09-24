#!/bin/bash
zip -r lambda.zip .
aws s3 cp lambda.zip s3://rluckom.lambda/archive_cloudfront_logs/lambda.zip
cd ../../terraform && terraform taint module.archive_cloudfront_logs_lambda.aws_lambda_function.lambda
