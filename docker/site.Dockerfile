# syntax=docker/dockerfile:1
#
# One static site in one locale, served by the shared nginx runtime from
# astro-k8s-deployment-kit. Used for every site in this monorepo:
#
#   docker build -f docker/site.Dockerfile \
#     --build-arg SITE=sanderdh --build-arg LOCALE=nl -t sanderdh-nl .
#
# Each site is built once per locale (.com = en, .nl = nl), so a site has two
# images. The nginx server config is NOT baked in: the kit's base mounts it
# from the app-nginx-config ConfigMap. To run an image the way the cluster does:
#
#   docker run --rm -p 8080:8080 \
#     --read-only --tmpfs /tmp --tmpfs /var/cache/nginx \
#     --user 101:101 --cap-drop ALL \
#     -v "/path/to/astro-k8s-deployment-kit/base/nginx-default.conf:/etc/nginx/conf.d/default.conf:ro" \
#     sanderdh-nl

# Pin to a nginx-sha-<commit> tag for reproducible builds.
ARG NGINX_IMAGE=ghcr.io/nickmous/astro-k8s-deployment-kit:nginx-latest

FROM node:24-trixie-slim AS build
WORKDIR /app

# Which workspace in sites/ to build, and in which locale.
ARG SITE
ARG LOCALE=en
# Passed by the kit's deploy workflow. Not used: each site derives its URL from
# SITE + LOCALE (see siteUrl() in the ui-kit), so it can never disagree with
# the domain the image is served on.
ARG SITE_URL=""

RUN test -n "$SITE" || (echo "Build arg SITE is required" >&2 && exit 1)

# Workspaces need every package.json present for `npm ci`, so the whole
# (dockerignored) repo goes in before installing.
COPY . .
RUN npm ci --no-audit --no-fund

# Fonts are downloaded from Fontsource during this build (Astro Fonts API).
RUN LOCALE="$LOCALE" npm run "build:$LOCALE" -w "@portfolio/$SITE" \
    && mv "sites/$SITE/dist/$LOCALE" /out

# Pre-compress text assets. nginx serves the .br / .gz sibling directly via
# brotli_static / gzip_static: best ratio, zero per-request CPU.
RUN apt-get update \
    && apt-get install -y --no-install-recommends brotli \
    && rm -rf /var/lib/apt/lists/* \
    && find /out -type f \( \
           -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.mjs' \
           -o -name '*.svg' -o -name '*.json' -o -name '*.xml' -o -name '*.txt' \
       \) -size +256c \
       -exec gzip -9 -k -f {} + \
       -exec brotli -q 11 -k -f {} +

FROM ${NGINX_IMAGE} AS runtime
COPY --from=build /out /usr/share/nginx/html
EXPOSE 8080
