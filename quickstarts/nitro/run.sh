#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   build             npx nitro build                                                    -> build.log (run once first)
#   start             npm run start    (NODE_OPTIONS='--import ./instrument.mjs' node .output/server/index.mjs, guide script)
#   preview           npm run preview  (NODE_OPTIONS='--import ./instrument.mjs' nitro preview, guide script)
#   dev               npm run dev -- --port 4736 (NODE_OPTIONS='--import ./instrument.mjs' nitro dev, guide script)
#   errors-only       NODE_OPTIONS='--import ./instrument-errors-only.mjs' node .output/server/index.mjs  (no tracesSampleRate)
#   no-error-handler  NODE_OPTIONS='--import ./instrument-no-error-handler.mjs' node .output/server/index.mjs (enableNitroErrorHandler: false)
#   no-import         node .output/server/index.mjs (the --import flag forgotten)
#   latest-nitro      npm run start after `npm install nitro@3.0.260903-beta --legacy-peer-deps` (package.json now pins that version)
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-start}"
SINK_PORT="${SINK_PORT:-4735}"
APP_PORT="${APP_PORT:-4736}"
SINK="http://127.0.0.1:${SINK_PORT}"
APP="http://127.0.0.1:${APP_PORT}"
cd "$DIR"
unset SENTRY_AUTH_TOKEN SENTRY_ORG SENTRY_PROJECT

if [ "$VARIANT" = build ]; then
  timeout 120 npx nitro build > "$DIR/build.log" 2>&1
  echo "build exit $?"; tail -5 "$DIR/build.log"
  REPRO_ROOT="$(cd "$DIR/../.." && pwd)"; sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/build.log"
  exit 0
fi

for p in "$SINK_PORT" "$APP_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is busy"; exit 1; fi
done

EXPECT_SPANS=1; EXPECT_ANY=1
case "$VARIANT" in
  start)            CMD='npm run start' ;;
  latest-nitro)     CMD='npm run start' ;;
  preview)          CMD='npm run preview' ;;
  dev)              CMD='npm run dev -- --port '"$APP_PORT" ;;
  errors-only)      CMD='NODE_OPTIONS="--import ./instrument-errors-only.mjs" node .output/server/index.mjs'; EXPECT_SPANS=0 ;;
  no-error-handler) CMD='NODE_OPTIONS="--import ./instrument-no-error-handler.mjs" node .output/server/index.mjs'; EXPECT_SPANS=0 ;;
  no-import)        CMD='node .output/server/index.mjs'; EXPECT_ANY=0 ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

export SENTRY_TUNNEL="$SINK/"
export PORT="$APP_PORT"
eval "$CMD > \"$DIR/app-$VARIANT.log\" 2>&1 &"
APP_PID=$!

ALIVE=1
for _ in $(seq 1 300); do
  if ! kill -0 "$APP_PID" 2>/dev/null; then ALIVE=0; break; fi
  curl -s -o /dev/null "$APP/nope" && break
  sleep 0.2
done

STEPS="$DIR/.steps-$VARIANT.jsonl"; : > "$STEPS"
step() {
  local name="$1" url="$2"; shift 2
  local out rc
  out=$(curl -s -o "$DIR/.body" -D "$DIR/.hdr" -w '%{http_code} %{time_total}' "$@" "$url" 2>/dev/null); rc=$?
  NAME="$name" OUT="$out" RC="$rc" node -e '
const fs=require("fs");const h=fs.readFileSync(process.argv[1],"utf8").split(/\r?\n/).filter(l=>/^server-timing/i.test(l));
const body=process.env.NAME==="/outgoing"?fs.readFileSync(process.argv[2],"utf8").slice(0,300):undefined;
const [code,seconds]=process.env.OUT.split(" ");
console.log(JSON.stringify({route:process.env.NAME,http_code:code,seconds,curl_exit:Number(process.env.RC),server_timing:h,body}))' "$DIR/.hdr" "$DIR/.body" >> "$STEPS"
}

if [ "$ALIVE" = 1 ]; then
  step /api/users/42 "$APP/api/users/42"
  step /debug-sentry "$APP/debug-sentry"
  step /error-404 "$APP/error-404"
  step /error-503 "$APP/error-503"
  step /debug-log "$APP/debug-log"
  step /process-payment "$APP/process-payment"
  step /outgoing "$APP/outgoing" --max-time 5
  step /debug-sentry-tracing "$APP/debug-sentry-tracing" --max-time 5
  step /sentinel "$APP/sentinel"

  # Wait for the sentinel event, the sentinel's server span (when tracing is on) and the timer-flushed log
  # batch. No fixed sleeps; hard deadline 60 s (15 s when nothing is expected to arrive).
  LIMIT=300; [ "$EXPECT_ANY" = 0 ] && LIMIT=75
  for _ in $(seq 1 $LIMIT); do
    if ! kill -0 "$APP_PID" 2>/dev/null; then ALIVE=0; break; fi
    if [ "$EXPECT_ANY" = 1 ] && curl -s "$SINK/__items" | EXPECT_SPANS="$EXPECT_SPANS" node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const sentinel=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const sentinelSpan=process.env.EXPECT_SPANS==="0"||i.some(x=>x.type==="span"&&(x.raw||[]).some(r=>r.is_segment&&String(r.url||r.route||"").endsWith("/sentinel")));
  const log=i.some(x=>x.type==="log");
  process.exit(sentinel&&sentinelSpan&&log?0:1);
})'; then break; fi
    sleep 0.2
  done
fi

REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/app-$VARIANT.log"
node "$DIR/summarize.mjs" "$VARIANT" "$CMD" "$DIR/app-$VARIANT.log" "$STEPS" "$SINK" "$ALIVE" "$EXPECT_SPANS" "$DIR/build.log" > "$DIR/results-$VARIANT.json"
rm -f "$STEPS" "$DIR/.hdr" "$DIR/.body"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/results-$VARIANT.json"

# npm run and nitro dev fork children: kill the tree and whatever still listens on the app port.
pkill -P "$APP_PID" 2>/dev/null; kill "$APP_PID" 2>/dev/null; wait "$APP_PID" 2>/dev/null
for _ in 1 2 3; do lsof -ti tcp:"$APP_PORT" 2>/dev/null | xargs kill -9 2>/dev/null; sleep 0.2; done
kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null
echo "wrote results-$VARIANT.json (app log: app-$VARIANT.log)"
