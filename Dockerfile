# nordaaker/convos
#
# BUILD: docker build --no-cache --rm -t nordaaker/convos .
# RUN:   docker run -it --rm -p 8080:3000 -v /var/convos/data:/data nordaaker/convos
FROM alpine:3.4
MAINTAINER jhthorsen@cpan.org

WORKDIR /

RUN apk update && \
  apk del wget && \
  apk add perl perl-io-socket-ssl perl-dev g++ make openssl openssl-dev wget curl && \
  curl -L https://github.com/Nordaaker/convos/archive/stable.tar.gz | tar xvz && \
  /convos-stable/script/convos install && \
  apk del perl-dev g++ make openssl openssl-dev curl && \
  rm -rf /root/.cpanm /usr/local/share/man/*

#
# See https://convos.by/doc/config.html for details about the environment variables
#

# ENV CONVOS_INVITE_CODE some_super_long_and_secret_string
# ENV CONVOS_SECRETS some_other_super_long_and_secret_string
# ENV CONVOS_DEFAULT_SERVER chat.freenode.net:6697
# ENV CONVOS_FORCED_IRC_SERVER 0
# ENV CONVOS_PLUGINS ShareDialog,OtherCustomPlugin
ENV CONVOS_CONTACT mailto:root@localhost
ENV CONVOS_ORGANIZATION_NAME Nordaaker
ENV CONVOS_SECURE_COOKIES 0

# https://convos.by/doc/faq.html#can-convos-run-behind-behind-my-favorite-web-server
ENV MOJO_REVERSE_PROXY 0

# Do not change these variables unless you know what you're doing
ENV CONVOS_HOME /data
ENV MOJO_LISTEN http://*:3000
ENV MOJO_MODE production

VOLUME ["/data"]
EXPOSE 3000
CMD []
ENTRYPOINT ["/convos-stable/script/convos", "daemon"]
