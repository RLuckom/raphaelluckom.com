FROM ubuntu:bionic

RUN apt-get update && \
    apt-get install -y curl tar && \
    curl -L -o hugo.tar.gz https://github.com/gohugoio/hugo/releases/download/v0.74.3/hugo_extended_0.74.3_Linux-64bit.tar.gz && tar xzvf hugo.tar.gz

WORKDIR /input

USER nobody:nogroup

ENTRYPOINT ["/hugo"]
