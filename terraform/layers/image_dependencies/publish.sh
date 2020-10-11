#!/bin/bash
rm -f layer.zip
zip -r layer.zip .
aws s3 cp layer.zip s3://rluckom.lambda/layers/image_dependencies/layer.zip
cd ../../ && terraform taint aws_lambda_layer_version.image_dependencies
