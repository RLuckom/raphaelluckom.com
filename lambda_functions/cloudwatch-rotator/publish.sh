#!/bin/bash
zip -r lambda.zip .
aws s3 cp lambda.zip s3://rluckom.lambda/log_export_notification/lambda.zip
cd ../../terraform && terraform taint module.log_export_notification_lambda.module.permissioned_lambda.aws_lambda_function.lambda
