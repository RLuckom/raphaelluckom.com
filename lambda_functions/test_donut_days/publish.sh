#!/bin/bash
zip -r lambda.zip .
aws s3 cp lambda.zip s3://rluckom.lambda/test_donut_days/lambda.zip
cd ../../terraform && terraform taint module.test_donut_days_lambda.aws_lambda_function.lambda
