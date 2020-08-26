#!/bin/bash
zip -r log-rotator.zip .
aws s3 cp log-rotator.zip s3://rluckom.lambda/log-rotator/log-rotator.zip
cd ../../terraform && terraform taint module.log_rotator_lambda.aws_lambda_function.lambda
