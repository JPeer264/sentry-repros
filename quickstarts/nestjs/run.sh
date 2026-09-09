#!/usr/bin/env bash
# Usage: ./run.sh <variant>   (build first: npx tsc -p tsconfig.json)
#   cjs              node dist/main.js                                   (guide: main.ts with import "./instrument" first, compiled to CJS; SentryModule.forRoot() + SentryGlobalFilter)
#   no-filter        node dist/main-no-filter.js                         (index.mdx state before "Capture Nest.js Errors": SentryModule.forRoot() only)
#   no-module        node dist/main-no-module.js                         (SentryGlobalFilter only, no SentryModule.forRoot())
#   custom-filter    node dist/main-custom-filter.js                     (@SentryExceptionCaptured() on a custom catch-all filter)
#   import-flag      node --import ./dist/instrument.js dist/main-no-instrument.js   (install/esm.mdx --import path on the CJS build)
#   node-options     NODE_OPTIONS="--import ./dist/instrument.js" node dist/main-no-instrument.js
#   errors-only      node dist/main-errors-only.js                       (config without tracesSampleRate)
#   verify-tracing   node dist/main.js, then only /debug-sentry-tracing and /sentinel (tracing verify snippet, throw inside setTimeout)
#   esm-verbatim     node dist-esm/main.js                               (same sources emitted as ESM, import "./instrument" verbatim)
#   esm-start-script sh -c '--import ./instrument.mjs nest start'        (install/esm.mdx:35 start script verbatim)
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-cjs}"
SINK_PORT="${SINK_PORT:-4730}"
APP_PORT="${APP_PORT:-4731}"
SINK="http://127.0.0.1:${SINK_PORT}"
APP="http://127.0.0.1:${APP_PORT}"
for p in "$SINK_PORT" "$APP_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is busy"; exit 1; fi
done

cd "$DIR"
EXPECT_SPANS=1
EXPECT_LOG=1
EXPECT_CHECKIN=1
TRACING_ROUTE=0
case "$VARIANT" in
  cjs)              CMD='node dist/main.js' ;;
  no-filter)        CMD='node dist/main-no-filter.js' ;;
  no-module)        CMD='node dist/main-no-module.js' ;;
  custom-filter)    CMD='node dist/main-custom-filter.js' ;;
  import-flag)      CMD='node --import ./dist/instrument.js dist/main-no-instrument.js' ;;
  node-options)     CMD='NODE_OPTIONS="--import ./dist/instrument.js" node dist/main-no-instrument.js' ;;
  errors-only)      CMD='node dist/main-errors-only.js'; EXPECT_SPANS=0 ;;
  verify-tracing)   CMD='node dist/main.js'; TRACING_ROUTE=1; EXPECT_LOG=0; EXPECT_CHECKIN=0 ;;
  esm-verbatim)     CMD='node dist-esm/main.js' ;;
  esm-start-script) CMD="sh -c '--import ./instrument.mjs nest start'" ;;
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
for _ in $(seq 1 150); do
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
  if [ "$TRACING_ROUTE" = 1 ]; then
    step /debug-sentry-tracing "$APP/debug-sentry-tracing" --max-time 3
    step /sentinel "$APP/sentinel"
  else
    step /users/42 "$APP/users/42"
    step /debug-sentry "$APP/debug-sentry"
    step /error-404 "$APP/error-404"
    step /error-503 "$APP/error-503"
    step /error-500-http "$APP/error-500-http"
    step /debug-log "$APP/debug-log"
    step /cron "$APP/cron"
    step /sentinel "$APP/sentinel"
  fi

  # Wait for the sentinel event, the sentinel's server span (when tracing is on), the timer-flushed log batch and
  # the cron check-in. No fixed sleeps; hard deadline 60 s.
  for _ in $(seq 1 300); do
    if ! kill -0 "$APP_PID" 2>/dev/null; then ALIVE=0; break; fi
    if curl -s "$SINK/__items" | EXPECT_SPANS="$EXPECT_SPANS" EXPECT_LOG="$EXPECT_LOG" EXPECT_CHECKIN="$EXPECT_CHECKIN" node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const sentinel=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const sentinelSpan=process.env.EXPECT_SPANS==="0"||i.some(x=>x.type==="span"&&(x.raw||[]).some(r=>r.is_segment&&String(r.url||r.route||"").endsWith("/sentinel")));
  const log=process.env.EXPECT_LOG==="0"||i.some(x=>x.type==="log");
  const checkin=process.env.EXPECT_CHECKIN==="0"||i.filter(x=>x.type==="check_in").length>=2;
  process.exit(sentinel&&sentinelSpan&&log&&checkin?0:1);
})'; then break; fi
    sleep 0.2
  done
fi

REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/app-$VARIANT.log"
node "$DIR/summarize.mjs" "$VARIANT" "$CMD" "$DIR/app-$VARIANT.log" "$STEPS" "$SINK" "$ALIVE" "$EXPECT_SPANS" > "$DIR/results-$VARIANT.json"
rm -f "$STEPS"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/results-$VARIANT.json"

kill "$APP_PID" 2>/dev/null; wait "$APP_PID" 2>/dev/null
kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null
echo "wrote results-$VARIANT.json (app log: app-$VARIANT.log)"
