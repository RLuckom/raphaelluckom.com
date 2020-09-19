#!/bin/bash
zip -r lambda.zip .
aws s3 cp lambda.zip s3://rluckom.lambda/photo-resize/lambda.zip
#cd ../../terraform && terraform taint module.photos_etl.aws_lambda_function.lambda
