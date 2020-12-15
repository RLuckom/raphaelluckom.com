#!/bin/sh
aws s3 rm s3://test.raphaelluckom.com/assets --recursive
aws s3 cp ./assets/templates s3://test.raphaelluckom.com/assets/templates  --recursive --content-type "text/html" 
aws s3 cp ./assets/static/css/ s3://test.raphaelluckom.com/assets/static/css/  --recursive --content-type "text/css" 
aws s3 cp ./assets/static/fonts/ s3://test.raphaelluckom.com/assets/static/fonts/  --recursive --content-type "text/css" 
