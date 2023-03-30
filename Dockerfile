FROM abiosoft/caddy
MAINTAINER shurrik

COPY Caddyfile /etc/Caddyfile
RUN mkdir /srv/file
COPY ./_site /srv/blog/