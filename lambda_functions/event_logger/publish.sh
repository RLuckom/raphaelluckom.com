#!/bin/bash
zip -r lambda.zip .
aws s3 cp lambda.zip s3://rluckom.lambda/event_logger/lambda.zip
#cd ../../terraform && terraform taint module.websocket_api_connect_route.aws_lambda_function.integration_lambda
