#!/usr/bin/env bash
# Build with Vite, then deploy a fresh worker for one run: repro-<run>-cache-<on|off>, with its own
# Sentry environment.
#
# usage: scripts/deploy.sh <run-id> [on|off]
# env:   SENTRY_DSN, WORKERS_SUBDOMAIN
. "$(dirname "$0")/lib.sh" "$@"
: "${SENTRY_DSN:?set SENTRY_DSN}"

npx vite build

# Older @sentry/cloudflare releases keep the auto-instrumentation behind an experimental flag and
# build an unwrapped worker without a warning.
if ! grep -q "instrumentDurableObjectWithSentry" dist/*/index.js; then
  echo "the built worker is not instrumented: this needs an @sentry/cloudflare with auto-instrumentation on by default" >&2
  exit 1
fi

npx wrangler deploy --name "$worker" \
  --var "SENTRY_DSN:${SENTRY_DSN}" \
  --var "SENTRY_ENVIRONMENT:${environment}" \
  --var "CACHE_CLIENT:$([[ "$cache" == "on" ]] && echo true || echo false)"

echo "deployed $(worker_url) (Sentry environment: ${environment})"
