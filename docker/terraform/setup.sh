!#/bin/sh
set -e

docker build -t terraform -f Dockerfile .

mkdir -p ~/.bin

rm ~/.bin/terraform
ln -sf $(pwd)/terraform ~/.bin/terraform
