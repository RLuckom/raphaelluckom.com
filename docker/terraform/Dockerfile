FROM ubuntu:bionic

RUN apt-get update && \
    apt-get install -y curl zip && \
    curl -L -o terraform.zip https://releases.hashicorp.com/terraform/0.11.7/terraform_0.11.7_linux_amd64.zip && \
    unzip terraform.zip

WORKDIR /input

USER nobody:nogroup

ENTRYPOINT ["/terraform"]
