!#/bin/bash
set -e

docker build -t hugo -f Dockerfile .

mkdir -p ~/.bin

ln -s $(pwd)/hugo ~/.bin/hugo
