# Cap publishes only :latest, so the web image is pinned by digest.
FROM ghcr.io/capsoftware/cap-web@sha256:e2dbc1e802011c46190c8de19ced866ae43b9dfb23946d49203b368a8cd81719

# The start script runs as root to own the volume and set bucket CORS, then
# drops to Cap's own nextjs user.
USER root
RUN apk add --no-cache su-exec
COPY railway-start.sh bucket-cors.mjs railway-migrate.mjs /railway/
RUN chmod +x /railway/railway-start.sh
CMD ["/railway/railway-start.sh"]
