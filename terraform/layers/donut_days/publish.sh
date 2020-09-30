#!/bin/bash
rm -f layer.zip
zip -r layer.zip .
aws s3 cp layer.zip s3://rluckom.lambda/layers/donut_days/layer.zip
cd ../../terraform && terraform taint aws_lambda_layer_version.donut_days
