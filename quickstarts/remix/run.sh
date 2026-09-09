#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   remix-serve            build, then NODE_OPTIONS='--import=./instrument.server.mjs' remix-serve ./build/server/index.js
#                          with handleError = wrapHandleErrorWithSentry (javascript.remix.mdx:316-320)
#   remix-serve-direct     same server, handleError = sentryHandleError (javascript.remix.mdx:323)
#   express                node server.mjs (imports ./instrument.server.mjs first, javascript.remix.mdx:230-240)
#   vite-plugin            remix-serve, built with sentryRemixVitePlugin from "@sentry/remix/vite"
#   vite-plugin-docs       build only: vite.config.ts importing sentryVitePlugin from "@sentry/vite-plugin" (:362)
#   handle-error-verbatim  build only: entry.server.tsx with both handleError exports as printed (:313-324)
#   docs-start-command     start only: NODE_OPTIONS='--import=./instrument.server.mjs' remix-serve build (:210)
# Sink on 4758, app on 4759; both must be free. Every process started here is killed at the end.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-remix-serve}"
SINK_PORT=4758
APP_PORT=4759
export BASE_URL="http://localhost:${APP_PORT}"
export SINK_URL="http://localhost:${SINK_PORT}"
export RESULT_NAME="results-${VARIANT}"
cd "$DIR"

for p in $SINK_PORT $APP_PORT; do
  if lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is in use, refusing to start"; exit 2; fi
done

ENTRY=wrap
PLUGIN=none
SERVER=remix-serve
BUILD=1
DRIVE=1
case "$VARIANT" in
  remix-serve) ;;
  remix-serve-direct) ENTRY=direct ;;
  express) SERVER=express ;;
  vite-plugin) PLUGIN=remix ;;
  vite-plugin-docs) PLUGIN=docs; DRIVE=0 ;;
  handle-error-verbatim) ENTRY=verbatim; DRIVE=0 ;;
  docs-start-command) BUILD=0; SERVER=docs-start ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

restore_entry() { cp "$DIR/app/variants/entry.server.wrap.tsx" "$DIR/app/entry.server.tsx"; }
cp "$DIR/app/variants/entry.server.${ENTRY}.tsx" "$DIR/app/entry.server.tsx"

# SKIP_BUILD=1 reuses the build/ directory of a previous call, BUILD_ONLY=1 stops after the build.
BUILD_STATUS=0
if [ "$BUILD" = 1 ] && [ "${SKIP_BUILD:-0}" != 1 ]; then
  rm -rf "$DIR/build"
  QS_VITE_PLUGIN="$PLUGIN" timeout 170 npx remix vite:build > "$DIR/build-${VARIANT}.log" 2>&1
  BUILD_STATUS=$?
  echo "build exit $BUILD_STATUS (build-${VARIANT}.log)"
fi
restore_entry
if [ "${BUILD_ONLY:-0}" = 1 ]; then exit $BUILD_STATUS; fi

write_min_results() {
  node -e '
    const fs = require("fs");
    const [variant, buildStatus, buildLog, serverStatus, serverLog] = process.argv.slice(1);
    const read = f => (f && fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n") : null);
    fs.writeFileSync(`results-${variant}.json`, JSON.stringify({ variant, build: { status: Number(buildStatus), log: read(buildLog) }, server: serverLog ? { status: Number(serverStatus), log: read(serverLog) } : null }, null, 2));
  ' "$VARIANT" "$BUILD_STATUS" "build-${VARIANT}.log" "${2:-}" "${1:-}"
}

if [ "$DRIVE" = 0 ]; then
  write_min_results
  echo "wrote results-${VARIANT}.json"
  exit 0
fi
if [ "$BUILD" = 1 ] && [ "$BUILD_STATUS" != 0 ]; then
  write_min_results
  exit 1
fi

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-${VARIANT}.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK_URL/__items" >/dev/null && break; sleep 0.1; done

SERVER_LOG="$DIR/server-${VARIANT}.log"
export SERVER_LOG
case "$SERVER" in
  remix-serve)
    PORT="$APP_PORT" NODE_OPTIONS='--import=./instrument.server.mjs' npx remix-serve ./build/server/index.js > "$SERVER_LOG" 2>&1 &
    ;;
  docs-start)
    PORT="$APP_PORT" NODE_OPTIONS='--import=./instrument.server.mjs' npx remix-serve build > "$SERVER_LOG" 2>&1 &
    ;;
  express)
    PORT="$APP_PORT" node server.mjs > "$SERVER_LOG" 2>&1 &
    ;;
esac
SERVER_PID=$!

READY=0
for _ in $(seq 1 100); do
  if curl -s -o /dev/null "$BASE_URL/" 2>/dev/null; then READY=1; break; fi
  if ! kill -0 $SERVER_PID 2>/dev/null; then break; fi
  sleep 0.2
done

STATUS=0
if [ "$READY" = 1 ]; then
  node "$DIR/drive.mjs" "$VARIANT"
  STATUS=$?
else
  wait $SERVER_PID 2>/dev/null
  SERVER_STATUS=$?
  echo "server did not become ready (exit $SERVER_STATUS), see server-${VARIANT}.log"
  write_min_results "$SERVER_LOG" "$SERVER_STATUS"
  STATUS=1
fi

kill $SERVER_PID 2>/dev/null; wait $SERVER_PID 2>/dev/null
kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
pkill -f "remix-serve ./build/server/index.js" 2>/dev/null
echo "wrote $DIR/${RESULT_NAME}.json (server log: server-${VARIANT}.log, build log: build-${VARIANT}.log)"
exit $STATUS
