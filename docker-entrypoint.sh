#!/bin/sh
set -eu

: "${LABVERIFY_SESSION_SECRET:?LABVERIFY_SESSION_SECRET is required}"
: "${LABVERIFY_LOCAL_USERS:?LABVERIFY_LOCAL_USERS is required}"

printf 'LABVERIFY_LOCAL_MODE=true\nLABVERIFY_SESSION_SECRET=%s\nLABVERIFY_LOCAL_USERS=%s\nLABVERIFY_COOKIE_SECURE=%s\n' \
  "$LABVERIFY_SESSION_SECRET" "$LABVERIFY_LOCAL_USERS" "${LABVERIFY_COOKIE_SECURE:-false}" > /app/dist/server/.dev.vars

npx wrangler d1 execute DB --local --persist-to /data --config /app/dist/server/wrangler.json --file /app/drizzle/0000_adorable_warstar.sql
exec npx wrangler dev --local --persist-to /data --config /app/dist/server/wrangler.json --ip 0.0.0.0 --port 8787
