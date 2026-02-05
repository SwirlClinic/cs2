FROM php:8.2-fpm-bookworm AS php

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
    && docker-php-ext-install pdo_mysql \
    && rm -rf /var/lib/apt/lists/*

# Clone website to a staging dir (entrypoint copies to volume at runtime)
RUN git clone --depth 1 https://github.com/Nereziel/cs2-WeaponPaints.git /tmp/wp \
    && mv /tmp/wp/website /opt/wp-website \
    && rm -rf /tmp/wp

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]

# -----------------------------------------------------------
FROM nginx:stable-bookworm AS nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf
