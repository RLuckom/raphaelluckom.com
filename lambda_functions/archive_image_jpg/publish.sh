#!/bin/bash
zip -r lambda.zip .
aws s3 cp lambda.zip s3://rluckom.lambda/archive_image_jpg/lambda.zip
cd ../../terraform && terraform taint module.archive_image_jpg_lambda.aws_lambda_function.lambda
