#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   guide                node index.ts                              (guide Node.js tab, routes chained before .listen())
#   verify-verbatim      node index-verify-verbatim.ts              (verify snippet pasted after .listen(), as printed)
#   should-handle-error  node index-should-handle-error.ts          (guide shouldHandleError snippet)
#   bun-tab              node index-bun-tab.ts                      (guide Bun tab under Node, no adapter)
#   static               node index-static.ts                       (traceLifecycle: "static")
#   errors-only          node index-errors-only.ts                  (no tracesSampleRate)
#   import-flag          node --import ./instrument.mjs app.mjs     (not in the guide)
#   cjs                  node index.cjs                             (not in the guide)
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-guide}"
SINK_PORT="${SINK_PORT:-4732}"
APP_PORT="${APP_PORT:-4733}"
SINK="http://127.0.0.1:${SINK_PORT}"
APP="http://127.0.0.1:${APP_PORT}"
for p in "$SINK_PORT" "$APP_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is busy"; exit 1; fi
done

cd "$DIR"
EXPECT_SPANS=1
EXPECT_USERS_ROUTE=1
case "$VARIANT" in
  guide)               CMD='node index.ts' ;;
  verify-verbatim)     CMD='node index-verify-verbatim.ts'; EXPECT_USERS_ROUTE=0 ;;
  should-handle-error) CMD='node index-should-handle-error.ts' ;;
  bun-tab)             CMD='node index-bun-tab.ts' ;;
  static)              CMD='node index-static.ts' ;;
  errors-only)         CMD='node index-errors-only.ts'; EXPECT_SPANS=0 ;;
  import-flag)         CMD='node --import ./instrument.mjs app.mjs' ;;
  cjs)                 CMD='node index.cjs' ;;
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
HDR="$DIR/.hdr-$VARIANT"
step() {
  local name="$1" url="$2"; shift 2
  local out rc st
  out=$(curl -s -o /dev/null -D "$HDR" -w '%{http_code} %{time_total}' "$@" "$url" 2>/dev/null); rc=$?
  st=$(grep -i '^sentry-trace:' "$HDR" 2>/dev/null | tr -d '\r' | cut -d' ' -f2-)
  echo "{\"route\":\"$name\",\"http_code\":\"${out%% *}\",\"seconds\":\"${out##* }\",\"curl_exit\":$rc,\"sentry_trace_header\":\"$st\"}" >> "$STEPS"
}

if [ "$ALIVE" = 1 ]; then
  step / "$APP/"
  step /users/42 "$APP/users/42"
  step /debug-sentry "$APP/debug-sentry"
  step /error-404 "$APP/error-404"
  step /error-503 "$APP/error-503"
  step /error-status-503 "$APP/error-status-503"
  step /debug-log "$APP/debug-log"
  step /debug-sentry-tracing "$APP/debug-sentry-tracing" --max-time 3
  step /sentinel "$APP/sentinel"

  # Wait for the sentinel event, the sentinel's server span (when tracing is on) and the timer-flushed log
  # batch. No fixed sleeps; hard deadline 60 s.
  for _ in $(seq 1 300); do
    if ! kill -0 "$APP_PID" 2>/dev/null; then ALIVE=0; break; fi
    if curl -s "$SINK/__items" | EXPECT_SPANS="$EXPECT_SPANS" EXPECT_USERS_ROUTE="$EXPECT_USERS_ROUTE" node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const sentinel=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const sentinelSpan=process.env.EXPECT_SPANS==="0"||i.some(x=>(x.type==="span"&&(x.raw||[]).some(r=>r.is_segment&&String(r.url||r.route||"").endsWith("/sentinel")))||(x.type==="transaction"&&x.name==="GET /sentinel"));
  const log=process.env.EXPECT_USERS_ROUTE==="0"||i.some(x=>x.type==="log");
  process.exit(sentinel&&sentinelSpan&&log?0:1);
})'; then break; fi
    sleep 0.2
  done
fi

REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/app-$VARIANT.log"
EXPECT_USERS_ROUTE="$EXPECT_USERS_ROUTE" node "$DIR/summarize.mjs" "$VARIANT" "$CMD" "$DIR/app-$VARIANT.log" "$STEPS" "$SINK" "$ALIVE" "$EXPECT_SPANS" > "$DIR/results-$VARIANT.json"
rm -f "$STEPS" "$HDR"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/results-$VARIANT.json"

kill "$APP_PID" 2>/dev/null; wait "$APP_PID" 2>/dev/null
kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null
echo "wrote results-$VARIANT.json (app log: app-$VARIANT.log)"
