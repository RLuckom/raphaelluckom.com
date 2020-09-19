#!/bin/bash
zip -r lambda.zip .
aws s3 cp lambda.zip s3://rluckom.lambda/media_trigger_lambda/lambda.zip
cd ../../terraform && terraform taint module.media_trigger_lambda.aws_lambda_function.lambda && terraform taint module.media_input_bucket.aws_lambda_permission.allow_caller[0]