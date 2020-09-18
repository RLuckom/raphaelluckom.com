#!/bin/bash
zip -r lambda.zip .
aws s3 cp lambda.zip s3://rluckom.lambda/rluckom.photos/lambda.zip
cd ../../terraform && terraform taint module.photos_lambda.aws_lambda_function.lambda
