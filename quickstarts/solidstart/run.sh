#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   import-flag   index.mdx:298 `node --import ./.output/server/instrument.server.mjs .output/server/index.mjs` (the page's command)
#   import-src    `node --import ./src/instrument.server.ts .output/server/index.mjs` (Node 22.18+ type stripping loads the page's TS file directly)
#   no-import     `node .output/server/index.mjs` (no preload at all; what the build-time nitro module gives on its own)
#   check-config  evaluates the page's app.config.ts / middleware subpath imports, no server
# SKIP_BUILD=1 reuses the existing .output. Sink on 4764, app on 4765; both must be free.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-import-flag}"
SINK_PORT=4764
APP_PORT=4765
cd "$DIR"

if [ "$VARIANT" = "check-config" ]; then
  node check-config.mjs
  exit $?
fi

case "$VARIANT" in
  import-flag) NODE_ARGS="--import ./.output/server/instrument.server.mjs" ;;
  import-src) NODE_ARGS="--import ./src/instrument.server.ts" ;;
  no-import) NODE_ARGS="" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

for p in $SINK_PORT $APP_PORT; do
  if lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is in use, refusing to start"; exit 1; fi
done

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  NODE_ENV=production timeout 170 npx vite build > build.log 2>&1 || { echo "build failed, see build.log"; tail -20 build.log; exit 1; }
fi
ls -la .output/server/*.mjs > output-server-listing.txt 2>&1

PORT=$SINK_PORT node sink.mjs > "sink-${VARIANT}.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "http://localhost:${SINK_PORT}/__items" >/dev/null && break; sleep 0.1; done

# shellcheck disable=SC2086
HOST=localhost PORT=$APP_PORT NODE_ENV=production node $NODE_ARGS .output/server/index.mjs > "app-${VARIANT}.log" 2>&1 &
APP_PID=$!

APP_URL="http://localhost:${APP_PORT}" SINK_URL="http://localhost:${SINK_PORT}" SERVER_LOG="app-${VARIANT}.log" node drive.mjs "$VARIANT"
STATUS=$?

kill $APP_PID 2>/dev/null; wait $APP_PID 2>/dev/null
kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/results-${VARIANT}.json (server log: app-${VARIANT}.log, build log: build.log)"
exit $STATUS
