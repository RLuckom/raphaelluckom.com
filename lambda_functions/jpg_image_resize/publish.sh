#!/bin/bash
zip -r lambda.zip .
aws s3 cp lambda.zip s3://rluckom.lambda/jpg_image_resize/lambda.zip
cd ../../terraform && terraform taint module.jpg_resize_lambda.aws_lambda_function.lambda
