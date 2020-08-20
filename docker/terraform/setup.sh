!#/bin/bash
set -e

docker build -t terraform -f Dockerfile .

mkdir -p ~/.bin

ln -sf $(pwd)/terraform ~/.bin/terraform
