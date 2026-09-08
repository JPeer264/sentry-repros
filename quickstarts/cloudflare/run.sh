#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   base        wrangler.jsonc          withSentry, nodejs_compat, compatibility_date 2026-09-01
#   compat-floor wrangler-floor.jsonc   same worker, compatibility_date 2024-09-23 (the include's floor)
#   request     wrangler-request.jsonc  wrapRequestHandler from @sentry/cloudflare/request, nodejs_als only
#   vite        dist/<worker>/wrangler.json from `vite build`, entry WITHOUT withSentry
#   waituntil   wrangler.jsonc, drives /debug-waituntil only
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-base}"
SINK_PORT=41501
APP_PORT=41502
SINK="http://127.0.0.1:${SINK_PORT}"
APP="http://127.0.0.1:${APP_PORT}"

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

cd "$DIR"
CONFIG="wrangler.jsonc"
case "$VARIANT" in
  base|waituntil) CONFIG="wrangler.jsonc" ;;
  compat-floor)   CONFIG="wrangler-floor.jsonc" ;;
  request)        CONFIG="wrangler-request.jsonc" ;;
  vite)
    ./node_modules/.bin/vite build > "$DIR/build-vite.log" 2>&1
    CONFIG="$(ls -d "$DIR"/dist/*/wrangler.json | head -1)"
    ;;
  *) echo "unknown variant $VARIANT"; kill $SINK_PID; exit 1 ;;
esac

./node_modules/.bin/wrangler dev --config "$CONFIG" --port "$APP_PORT" --inspector-port 0 \
  > "$DIR/app-$VARIANT.log" 2>&1 &
APP_PID=$!
for _ in $(seq 1 600); do grep -q "Ready on http" "$DIR/app-$VARIANT.log" && break; sleep 0.2; done

if [ "$VARIANT" = "waituntil" ]; then
  curl -s "$APP/debug-waituntil" >/dev/null
else
  curl -s "$APP/users/42"    >/dev/null
  curl -s "$APP/debug-sentry" >/dev/null
  curl -s "$APP/debug-span"   >/dev/null
  curl -s "$APP/debug-log"    >/dev/null
fi
curl -s "$APP/sentinel" >/dev/null

# Wait for the sentinel event (and, when it is expected, the timer-flushed log batch). No fixed sleeps.
WANT_LOG=1; [ "$VARIANT" = "waituntil" ] && WANT_LOG=0
for _ in $(seq 1 400); do
  if curl -s "$SINK/__items" | WANT_LOG=$WANT_LOG node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const sentinel=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const log=process.env.WANT_LOG==="0"||i.some(x=>x.type==="log");
  process.exit(sentinel&&log?0:1);
})'; then break; fi
  sleep 0.2
done

V="$VARIANT" node -e '
const [items,rawItems,headers]=process.argv.slice(1);
Promise.all([items,rawItems,headers].map(u=>fetch(u).then(r=>r.json()))).then(([i,r,h])=>{
  console.log(JSON.stringify({variant:process.env.V,items:i,
    envelopeTypes:r.map(x=>x.header.type),
    spansRaw:r.filter(x=>x.header.type==="span").map(x=>x.payload),
    transactionsRaw:r.filter(x=>x.header.type==="transaction").map(x=>x.payload),
    recorderHeaders:h},null,2));
});' "$SINK/__items" "$SINK/__items?raw=1" "$SINK/__headers" > "$DIR/results-$VARIANT.json"

kill $APP_PID 2>/dev/null; wait $APP_PID 2>/dev/null
kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/results-$VARIANT.json (worker log: app-$VARIANT.log)"
