#!/usr/bin/env bash
# Usage: ./run.sh <variant> build|drive
#   app-router    index.mdx: instrumentation-client.ts (SaaS-shaped client DSN so tunnelRoute applies), tunnel target kept local
#   pages-router  pages-router.mdx: sentry.client.config.ts instead, client DSN points straight at the sink
# `build` runs `next build` (production) and writes build-<variant>.log; `drive` starts the sink on 4750 and
# `next start -p 4751`, runs drive.mjs, writes results-<variant>.json, server-<variant>.log, sink-<variant>.log.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-app-router}"
ACTION="${2:-drive}"
export NEXT_TELEMETRY_DISABLED=1
export SINK_URL="http://localhost:4750"
export APP_URL="http://localhost:4751"
export SENTRY_DSN="http://public@localhost:4750/1"
export NEXT_PUBLIC_SINK_URL="$SINK_URL"
export RESULT_NAME="results-${VARIANT}"
export SERVER_LOG="$DIR/server-${VARIANT}.log"
export BUILD_LOG="$DIR/build-${VARIANT}.log"
cd "$DIR"

case "$VARIANT" in
  app-router)
    export NEXT_PUBLIC_SENTRY_DSN="https://public@o1.ingest.sentry.io/1"
    # Undocumented build-time override the SDK's own E2E tests use; keeps the tunnelRoute rewrite on this machine.
    export _SENTRY_TUNNEL_DESTINATION_OVERRIDE="$SINK_URL/tunnel"
    rm -f sentry.client.config.ts
    cp variants/app-router/instrumentation-client.ts instrumentation-client.ts
    ;;
  pages-router)
    export NEXT_PUBLIC_SENTRY_DSN="$SENTRY_DSN"
    rm -f instrumentation-client.ts
    cp variants/pages-router/sentry.client.config.ts sentry.client.config.ts
    ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

if [ "$ACTION" = "build" ]; then
  rm -rf .next
  timeout 170 npx next build > "$BUILD_LOG" 2>&1
  STATUS=$?
  echo "next build exit $STATUS (log: build-${VARIANT}.log)"
  exit $STATUS
fi

PORT=4750 node "$DIR/sink.mjs" > "$DIR/sink-${VARIANT}.log" 2>&1 &
SINK_PID=$!
node node_modules/next/dist/bin/next start -p 4751 > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK_URL/__items" >/dev/null && curl -sf -o /dev/null "$APP_URL/api/meta" && break; sleep 0.2; done

timeout 150 node "$DIR/drive.mjs" "$VARIANT"
STATUS=$?

kill $SERVER_PID $SINK_PID 2>/dev/null; wait $SERVER_PID $SINK_PID 2>/dev/null
# Only the ports this script opened.
lsof -ti tcp:4751 -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null
lsof -ti tcp:4750 -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null
echo "wrote $DIR/${RESULT_NAME}.json (server log: server-${VARIANT}.log)"
exit $STATUS
