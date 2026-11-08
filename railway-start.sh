#!/bin/sh
# Railway start for Cap's web app.
set -e

# Railway mounts one volume at /data, owned by root. Cap's workflow runner
# keeps its job state there so a redeploy doesn't lose queued work.
mkdir -p /data/workflow
chown -R nextjs:nodejs /data
export WORKFLOW_LOCAL_DATA_DIR="${WORKFLOW_LOCAL_DATA_DIR:-/data/workflow}"

# Browser and Chrome-extension uploads PUT straight to the bucket with presigned
# URLs, so the bucket must allow this origin and expose ETag. Railway buckets
# start with no CORS rules. A failure is logged, not fatal.
SDK=$(find /app/node_modules -maxdepth 5 -type d -path '*@aws-sdk/client-s3' 2>/dev/null | head -1)
if [ -n "$SDK" ] && [ -n "$CAP_AWS_BUCKET" ]; then
  AWS_SDK_PATH="$SDK" node /railway/bucket-cors.mjs || echo "railway: bucket CORS not set"
fi

# Migrate before listening, so the healthcheck waits for the schema. On a
# failure Cap's own migration (which also runs its backfills) gets its turn.
su-exec nextjs node /railway/railway-migrate.mjs || echo "railway: pre-start migration failed; Cap will retry"

# Railway's private network is IPv6: listen on all addresses so the media
# server can call back.
export HOSTNAME="::"
cd /app
exec su-exec nextjs node apps/web/server.js
