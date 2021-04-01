#!/bin/bash
cd ./frontend/lith
npm run browserify
cd -
cp frontend/lith/index-dist.js sites/private/assets/js
aws s3 cp sites/private/index.html s3://admin.raphaelluckom.com && aws s3 cp sites/private/post-entry.html s3://admin.raphaelluckom.com && aws s3 cp sites/private/assets/styles/styles.css s3://admin.raphaelluckom.com/assets/styles/ && aws s3 cp frontend/lith/index-dist.js s3://admin.raphaelluckom.com/assets/js/
