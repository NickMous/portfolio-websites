# syntax=docker/dockerfile:1
#
# The nickmous API as a php-fpm image for symfony-k8s-deployment-kit: the kit
# runs it next to its shared nginx image, copies /app/public-original into the
# volume nginx serves, then runs migrations and warms the cache.
#
#   docker build -t nickmous-api api/

FROM php:8.5-cli-alpine AS build

RUN apk add --no-cache git unzip icu-dev libzip-dev postgresql-dev \
    && docker-php-ext-install intl pdo_pgsql zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
ENV APP_ENV=prod

COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-progress

COPY . .
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative \
    && composer dump-env prod \
    && php bin/console assets:install public \
    && php bin/console cache:clear --no-debug

FROM php:8.5-fpm-alpine AS runtime

ARG SENTRY_RELEASE=""
ENV SENTRY_RELEASE=${SENTRY_RELEASE}

RUN apk add --no-cache icu-libs icu-data-full libpq libzip \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev libzip-dev postgresql-dev \
    && docker-php-ext-install intl pdo_pgsql \
    && apk del .build-deps

RUN cp /usr/local/etc/php/php.ini-production /usr/local/etc/php/php.ini \
    && { \
        echo 'opcache.memory_consumption=128'; \
        echo 'opcache.interned_strings_buffer=16'; \
        echo 'opcache.max_accelerated_files=20000'; \
        echo 'opcache.validate_timestamps=0'; \
        echo 'memory_limit=256M'; \
        echo 'expose_php=Off'; \
        echo 'date.timezone=UTC'; \
    } > /usr/local/etc/php/conf.d/app.ini

RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app

WORKDIR /app
COPY --from=build --chown=app:app /app /app

# The kit mounts emptyDirs over public/ and var/; the init container fills
# public/ from this copy. (OPcache is built into PHP 8.5.)
RUN cp -r public public-original \
    && mkdir -p var/cache var/log \
    && chown -R app:app var

USER app
EXPOSE 9000
CMD ["php-fpm"]
