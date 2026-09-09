#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   base            functions/_middleware.js at the functions root (the guide's layout), wrangler.jsonc
#   scoped          the same middleware file moved to functions/api/_middleware.js (DOC-R19)
#   include-config  root middleware, wrangler.jsonc swapped for the include's verbatim snippet
#                   (wrangler-include.jsonc, no pages_build_output_dir)
#   no-flag         root middleware, wrangler.jsonc swapped for wrangler-noflag.jsonc (no nodejs_compat)
#   no-flag-floor   same as no-flag with compatibility_date 2024-09-23 (wrangler-noflag-floor.jsonc)
# Ports: sink 4747, wrangler pages dev 4748, inspector 4749. Nothing else is opened.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-base}"
SINK_PORT=4747
APP_PORT=4748
INSPECTOR_PORT=4749
SINK="http://127.0.0.1:${SINK_PORT}"
APP="http://127.0.0.1:${APP_PORT}"
cd "$DIR"

restore() {
  [ -f functions/api/_middleware.js ] && mv functions/api/_middleware.js functions/_middleware.js
  [ -f .wrangler-base.jsonc.tmp ] && mv .wrangler-base.jsonc.tmp wrangler.jsonc
  return 0
}
APP_PID=""; SINK_PID=""
cleanup() {
  [ -n "$APP_PID" ] && { kill "$APP_PID" 2>/dev/null; wait "$APP_PID" 2>/dev/null; }
  [ -n "$SINK_PID" ] && { kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null; }
  pkill -f "workerd.*qs-cloudflare-pages" 2>/dev/null
  restore
}
trap cleanup EXIT INT TERM

case "$VARIANT" in
  base) ;;
  scoped) mv functions/_middleware.js functions/api/_middleware.js ;;
  include-config) mv wrangler.jsonc .wrangler-base.jsonc.tmp; cp wrangler-include.jsonc wrangler.jsonc ;;
  no-flag) mv wrangler.jsonc .wrangler-base.jsonc.tmp; cp wrangler-noflag.jsonc wrangler.jsonc ;;
  no-flag-floor) mv wrangler.jsonc .wrangler-base.jsonc.tmp; cp wrangler-noflag-floor.jsonc wrangler.jsonc ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

./node_modules/.bin/wrangler pages dev public --port "$APP_PORT" --inspector-port "$INSPECTOR_PORT" \
  > "$DIR/app-$VARIANT.log" 2>&1 &
APP_PID=$!
READY=0
for _ in $(seq 1 300); do
  grep -q "Ready on http" "$DIR/app-$VARIANT.log" && { READY=1; break; }
  kill -0 "$APP_PID" 2>/dev/null || break
  sleep 0.2
done

STEPS="[]"
if [ "$READY" = 1 ]; then
  STEPS="["
  for route in / /style.css /debug-sentry /debug-sentry-import /api/error /api/users/42 /api/fetch /api/log /api/waituntil /api/waituntil-reject /api/sentinel; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$APP$route")
    STEPS="$STEPS{\"route\":\"$route\",\"status\":$code},"
  done
  STEPS="${STEPS%,}]"
  # Sentinel: the last request captures a message and a span. Poll for both (plus the timer-flushed
  # log batch) with a 60 s deadline instead of sleeping.
  for _ in $(seq 1 300); do
    if curl -s "$SINK/__items" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const ev=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const sp=i.some(x=>x.type==="span"&&x.items.some(n=>n.endsWith("sentinel span")));
  const log=i.some(x=>x.type==="log");
  process.exit(ev&&sp&&log?0:1);
})'; then break; fi
    sleep 0.2
  done
fi

V="$VARIANT" READY="$READY" STEPS="$STEPS" LOG="$DIR/app-$VARIANT.log" node -e '
const fs=require("fs");
const [items,rawItems,headers]=process.argv.slice(1);
const log=fs.readFileSync(process.env.LOG,"utf8").split("\n");
const strip=l=>l.replace(/\x1b\[[0-9;]*m/g,"");
const console_={
  wrangler:log.map(strip).filter(l=>/WARNING|ERROR|✘|▲|Ready on|Compiling|nodejs_compat|compatibility/i.test(l)&&!/Sentry Logger/.test(l)).slice(0,40),
  sdkInit:log.map(strip).filter(l=>/Sentry Logger/.test(l)&&!/Integration installed/.test(l)&&!/Tracing/.test(l)).slice(0,30),
  integrations:[...new Set(log.map(strip).filter(l=>/Integration installed/.test(l)).map(l=>l.replace(/.*Integration installed: /,"").trim()))],
  tracingLines:log.map(strip).filter(l=>/\[Tracing\]/.test(l)).slice(0,40),
};
const ready=process.env.READY==="1";
Promise.all([items,rawItems,headers].map(u=>fetch(u).then(r=>r.json()))).then(([i,r,h])=>{
  console.log(JSON.stringify({variant:process.env.V,wranglerReady:ready,steps:JSON.parse(process.env.STEPS),
    console:console_,
    envelopeTypes:r.map(x=>x.header.type),
    items:i,
    spansRaw:r.filter(x=>x.header.type==="span").map(x=>x.payload),
    transactionsRaw:r.filter(x=>x.header.type==="transaction").map(x=>x.payload),
    recorderHeaders:h,
    verdict:null},null,2));
});' "$SINK/__items" "$SINK/__items?raw=1" "$SINK/__headers" > "$DIR/results-$VARIANT.json"
echo "wrote results-$VARIANT.json (ready=$READY, worker log: app-$VARIANT.log)"
