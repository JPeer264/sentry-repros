#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   import-flag           manual-setup.mdx:401 start command: NODE_OPTIONS='--import ./instrument.server.mjs' react-router-serve
#   import-flag-prod      the same start command with NODE_ENV=production set (see README, React dev/prod mismatch)
#   top-import            manual-setup.mdx:422-428 (import path corrected to ../instrument.server), plain react-router-serve
#   top-import-verbatim   manual-setup.mdx:422-428 as printed (`import './instrument.server'`), build only
# SKIP_BUILD=1 reuses the last build. Sink on 4760, app on 4761; both must be free.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-import-flag}"
SINK_PORT=4760
APP_PORT=4761
export SINK_URL="http://localhost:${SINK_PORT}"
export APP_URL="http://localhost:${APP_PORT}"
cd "$DIR"

case "$VARIANT" in
  import-flag) ENTRY=app/entry.server.docs.tsx; NODE_OPTS="--import ./instrument.server.mjs" ;;
  import-flag-prod) ENTRY=app/entry.server.docs.tsx; NODE_OPTS="--import ./instrument.server.mjs"; export NODE_ENV=production ;;
  top-import) ENTRY=app/entry.server.top-import.tsx; NODE_OPTS="" ;;
  top-import-verbatim) ENTRY=app/entry.server.top-import-verbatim.tsx; NODE_OPTS="" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

if [ -z "${SKIP_BUILD:-}" ]; then
  cp "$ENTRY" app/entry.server.tsx
  timeout 170 npx react-router build > "build-${VARIANT}.log" 2>&1
  BUILD_STATUS=$?
  echo "build exit $BUILD_STATUS (build-${VARIANT}.log)"
  [ "$BUILD_STATUS" -ne 0 ] && exit $BUILD_STATUS
  [ "$VARIANT" = "top-import-verbatim" ] && exit 0
fi

for p in $SINK_PORT $APP_PORT; do
  if lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is busy"; exit 1; fi
done

PORT=$SINK_PORT node sink.mjs > "sink-${VARIANT}.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK_URL/__items" >/dev/null && break; sleep 0.1; done

PORT=$APP_PORT NODE_OPTIONS="$NODE_OPTS" node node_modules/@react-router/serve/dist/cli.js ./build/server/index.js > "server-${VARIANT}.log" 2>&1 &
APP_PID=$!
# A TCP connect only, so the readiness probe creates no server span.
for _ in $(seq 1 300); do (echo > /dev/tcp/127.0.0.1/$APP_PORT) 2>/dev/null && break; sleep 0.1; done

SERVER_LOG="server-${VARIANT}.log" node drive.mjs "$VARIANT"
STATUS=$?

kill $APP_PID 2>/dev/null; wait $APP_PID 2>/dev/null
kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote results-${VARIANT}.json (server log: server-${VARIANT}.log)"
exit $STATUS
