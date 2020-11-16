#!/bin/bash
rm -f layer.zip
zip -r layer.zip .
aws s3 cp layer.zip s3://rluckom.lambda/layers/markdown_tools/layer.zip
cd ../../ && terraform taint aws_lambda_layer_version.markdown_tools
