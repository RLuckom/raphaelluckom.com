FROM ubuntu:bionic

RUN apt-get update && \
    apt-get install -y curl zip git && \
    curl -L -o terraform.zip https://releases.hashicorp.com/terraform/1.0.0/terraform_1.0.0_linux_amd64.zip && \
    unzip terraform.zip

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && ./aws/install

RUN mkdir /nogroup && export XDG_CONFIG_HOME=/nogroup && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash && export NVM_DIR=/nogroup/nvm && . "$NVM_DIR/nvm.sh" && nvm install 14.2.0 && chgrp -R nogroup /nogroup && chmod -R 775 /nogroup

WORKDIR /input

USER nobody:nogroup

ENV PATH=$PATH:/nogroup/nvm/versions/node/v14.2.0/bin/

ENTRYPOINT ["/terraform"]
