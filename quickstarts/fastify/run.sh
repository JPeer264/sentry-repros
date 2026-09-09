#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   import               node --import ./instrument.mjs app.mjs              (guide ESM path)
#   cjs                  node app.js                                          (guide CommonJS tab, require("./instrument"))
#   esm-tab              node app-esm-tab.mjs                                 (guide ESM tab verbatim, import "./instrument")
#   self-import          node app-first-line.mjs                              (first line import "./instrument.mjs")
#   node-options         NODE_OPTIONS="--import ./instrument.mjs" node app.mjs
#   require-flag         node --require ./instrument.js app.mjs
#   no-handler           node --import ./instrument.mjs app-no-handler.mjs    (no setupFastifyErrorHandler)
#   handler-options      node --import ./instrument.mjs app-handler-options.mjs (setupFastifyErrorHandler(app, { shouldHandleError }), error-handler page)
#   integration-options  node --import ./instrument-options.mjs app-no-handler.mjs (fastifyIntegration({ shouldHandleError }))
#   error-handler-page   node app-error-handler-page.mjs                      (error-handler page snippet verbatim, @sentry/fastify import)
#   late-init            node --import @sentry/node/preload app-late.mjs
#   fastify4             node --import ./instrument.mjs fastify4/app.mjs      (fastify 4)
#   fastify4-no-handler  node --import ./instrument.mjs fastify4/app-no-handler.mjs
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-import}"
SINK_PORT="${SINK_PORT:-4718}"
APP_PORT="${APP_PORT:-4719}"
SINK="http://127.0.0.1:${SINK_PORT}"
APP="http://127.0.0.1:${APP_PORT}"
for p in "$SINK_PORT" "$APP_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is busy"; exit 1; fi
done

cd "$DIR"
FASTIFY_DIR="."
case "$VARIANT" in
  import)              CMD='node --import ./instrument.mjs app.mjs' ;;
  cjs)                 CMD='node app.js' ;;
  esm-tab)             CMD='node app-esm-tab.mjs' ;;
  self-import)         CMD='node app-first-line.mjs' ;;
  node-options)        CMD='NODE_OPTIONS="--import ./instrument.mjs" node app.mjs' ;;
  require-flag)        CMD='node --require ./instrument.js app.mjs' ;;
  no-handler)          CMD='node --import ./instrument.mjs app-no-handler.mjs' ;;
  handler-options)     CMD='node --import ./instrument.mjs app-handler-options.mjs' ;;
  integration-options) CMD='node --import ./instrument-options.mjs app-no-handler.mjs' ;;
  error-handler-page)  CMD='node app-error-handler-page.mjs' ;;
  late-init)           CMD='node --import @sentry/node/preload app-late.mjs' ;;
  fastify4)            CMD='node --import ./instrument.mjs fastify4/app.mjs'; FASTIFY_DIR=fastify4 ;;
  fastify4-no-handler) CMD='node --import ./instrument.mjs fastify4/app-no-handler.mjs'; FASTIFY_DIR=fastify4 ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

export SENTRY_TUNNEL="$SINK/"
export APP_PORT
eval "$CMD > \"$DIR/app-$VARIANT.log\" 2>&1 &"
APP_PID=$!

ALIVE=1
for _ in $(seq 1 100); do
  if ! kill -0 "$APP_PID" 2>/dev/null; then ALIVE=0; break; fi
  curl -s -o /dev/null "$APP/nope" && break
  sleep 0.1
done

STEPS="$DIR/.steps-$VARIANT.jsonl"; : > "$STEPS"
step() {
  local name="$1" url="$2"; shift 2
  local out rc
  out=$(curl -s -o /dev/null -w '%{http_code} %{time_total}' "$@" "$url" 2>/dev/null); rc=$?
  echo "{\"route\":\"$name\",\"http_code\":\"${out%% *}\",\"seconds\":\"${out##* }\",\"curl_exit\":$rc}" >> "$STEPS"
}

if [ "$ALIVE" = 1 ]; then
  step /users/42 "$APP/users/42"
  step /debug-sentry "$APP/debug-sentry"
  step /error-404 "$APP/error-404"
  step /error-503 "$APP/error-503"
  step /debug-log "$APP/debug-log"
  step /debug-sentry-tracing "$APP/debug-sentry-tracing" --max-time 3
  step /sentinel "$APP/sentinel"

  # Wait for the sentinel event, the sentinel's server span and the timer-flushed log batch. No fixed sleeps.
  for _ in $(seq 1 300); do
    if ! kill -0 "$APP_PID" 2>/dev/null; then ALIVE=0; break; fi
    if curl -s "$SINK/__items" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const sentinel=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const sentinelSpan=i.some(x=>x.type==="span"&&(x.raw||[]).some(r=>r.is_segment&&String(r.url||r.route||"").endsWith("/sentinel")));
  const log=i.some(x=>x.type==="log");
  process.exit(sentinel&&sentinelSpan&&log?0:1);
})'; then break; fi
    sleep 0.2
  done
fi

REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/app-$VARIANT.log"
node "$DIR/summarize.mjs" "$VARIANT" "$CMD" "$FASTIFY_DIR" "$DIR/app-$VARIANT.log" "$STEPS" "$SINK" "$ALIVE" > "$DIR/results-$VARIANT.json"
rm -f "$STEPS"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/results-$VARIANT.json"

kill "$APP_PID" 2>/dev/null; wait "$APP_PID" 2>/dev/null
kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null
echo "wrote results-$VARIANT.json (app log: app-$VARIANT.log)"
