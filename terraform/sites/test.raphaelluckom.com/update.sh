#!/bin/sh
aws s3 sync . s3://test.raphaelluckom.com
aws s3 cp ./assets/static/css/ s3://test.raphaelluckom.com/assets/static/css/  --recursive --content-type "text/css" 
aws s3 cp ./assets/static/fonts/ s3://test.raphaelluckom.com/assets/static/fonts/  --recursive --content-type "text/css" 
