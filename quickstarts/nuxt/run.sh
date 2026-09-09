#!/usr/bin/env bash
# Usage: ./run.sh build [default|top-level-import|dynamic-import]   nuxt build with the matching
#          `autoInjectServerSentry` value (none for default)                      -> build-<label>.log
#        ./run.sh plain             node .output/server/index.mjs (default build)                  -> results-plain.json
#        ./run.sh import-flag       node --import ./.output/server/sentry.server.config.mjs ...     -> results-import-flag.json
#        ./run.sh top-level-import  node .output/server/index.mjs after `build top-level-import`    -> results-top-level-import.json
#        ./run.sh dynamic-import    node .output/server/index.mjs after `build dynamic-import`      -> results-dynamic-import.json
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
export NUXT_TELEMETRY_DISABLED=1
unset SENTRY_AUTH_TOKEN SENTRY_ORG SENTRY_PROJECT NODE_OPTIONS
SINK_PORT=4752
APP_PORT=4753
SINK="http://localhost:$SINK_PORT"
APP="http://localhost:$APP_PORT"
REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
scrub() { sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$1"; }

if [ "${1:-}" = build ]; then
  LABEL="${2:-default}"
  case "$LABEL" in
    default) INJECT="" ;;
    top-level-import) INJECT="top-level-import" ;;
    dynamic-import) INJECT="experimental_dynamic-import" ;;
    *) echo "unknown build $LABEL"; exit 1 ;;
  esac
  rm -rf .output
  SENTRY_AUTO_INJECT="$INJECT" timeout 170 npx nuxt build > "build-$LABEL.log" 2>&1
  echo "build exit $?" | tee -a "build-$LABEL.log"
  {
    echo; echo "# ls .output/server"; ls .output/server
    echo "# head -30 .output/server/index.mjs"; head -30 .output/server/index.mjs
    echo "# .output/server/sentry.server.config.mjs"; cat .output/server/sentry.server.config.mjs 2>&1
  } >> "build-$LABEL.log"
  scrub "build-$LABEL.log"
  exit 0
fi

VARIANT="${1:-plain}"
BUILD_LABEL="$VARIANT"
case "$VARIANT" in
  plain) CMD="node .output/server/index.mjs"; BUILD_LABEL=default ;;
  import-flag) CMD="node --import ./.output/server/sentry.server.config.mjs .output/server/index.mjs"; BUILD_LABEL=default ;;
  top-level-import|dynamic-import) CMD="node .output/server/index.mjs" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac
for p in "$SINK_PORT" "$APP_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is busy"; exit 1; fi
done

APP_PID=
PORT="$SINK_PORT" node sink.mjs > "sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
trap 'kill $APP_PID $SINK_PID 2>/dev/null; lsof -ti tcp:$APP_PORT 2>/dev/null | xargs kill -9 2>/dev/null' EXIT
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

PORT="$APP_PORT" $CMD > "app-$VARIANT.log" 2>&1 &
APP_PID=$!
ALIVE=1
for _ in $(seq 1 150); do
  if ! kill -0 "$APP_PID" 2>/dev/null; then ALIVE=0; break; fi
  curl -s -o /dev/null "$APP/api/echo" && break
  sleep 0.2
done

APP_ALIVE="$ALIVE" APP_LOG="app-$VARIANT.log" BUILD_LOG="build-$BUILD_LABEL.log" SERVER_CMD="$CMD" node drive.mjs "$VARIANT"
STATUS=$?

kill "$APP_PID" 2>/dev/null; wait "$APP_PID" 2>/dev/null
for _ in 1 2 3; do lsof -ti tcp:"$APP_PORT" 2>/dev/null | xargs kill -9 2>/dev/null; sleep 0.2; done
kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null
scrub "app-$VARIANT.log"; scrub "results-$VARIANT.json"
echo "wrote results-$VARIANT.json (server log: app-$VARIANT.log)"
exit $STATUS
