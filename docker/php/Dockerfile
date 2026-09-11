# PHP 8.3 FPM for the Symfony application.
#
# Debian (bookworm) rather than Alpine, deliberately: Imvite depends on ICU for
# locale-aware date formatting, ICU collation of guest names, and grapheme
# segmentation (docs/architecture/03-i18n-and-typography.md). Debian ships a
# full ICU; musl-based images have a history of locale edge cases that would
# surface as subtly wrong Albanian or Turkish sorting rather than as a crash.

FROM php:8.3-fpm-bookworm

# install-php-extensions resolves the system libraries each extension needs,
# which is the part that is tedious and easy to get wrong by hand.
COPY --from=mlocati/php-extension-installer:2 /usr/bin/install-php-extensions /usr/local/bin/

RUN install-php-extensions \
      intl \
      pdo_pgsql \
      pgsql \
      zip \
      opcache \
      redis \
      apcu \
    && rm -rf /tmp/*

# Composer, from the official image rather than a curl|php install.
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

RUN apt-get update && apt-get install -y --no-install-recommends \
      git \
      unzip \
      postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY docker/php/conf.d/ /usr/local/etc/php/conf.d/

WORKDIR /app

# php-fpm runs as www-data; bind-mounted source must stay writable for
# var/cache and var/log. On Linux hosts see DEVELOPMENT.md if you hit
# permission errors on var/.
EXPOSE 9000
CMD ["php-fpm"]
