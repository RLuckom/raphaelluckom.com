FROM ubuntu:bionic

RUN apt-get update && \
    apt-get install -y curl zip && \
    curl -L -o terraform.zip https://releases.hashicorp.com/terraform/0.13.0/terraform_0.13.0_linux_amd64.zip && \
    unzip terraform.zip

WORKDIR /input

USER nobody:nogroup

ENTRYPOINT ["/terraform"]
