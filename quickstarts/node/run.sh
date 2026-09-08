#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   import       node --import ./instrument.mjs app.mjs            (documented ESM way)
#   require-cjs  node --require ./instrument.cjs app.mjs
#   self-import  node app-import-first.mjs                          (import "./instrument.mjs" first line)
#   node-options NODE_OPTIONS="--import ./instrument.mjs" node app.mjs
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-import}"
SINK_PORT="${SINK_PORT:-41317}"
APP_PORT="${APP_PORT:-41318}"
SINK="http://127.0.0.1:${SINK_PORT}"
APP="http://127.0.0.1:${APP_PORT}"

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

export SENTRY_TUNNEL="$SINK/"
export RECORDER_URL="$SINK"
export APP_PORT

cd "$DIR"
case "$VARIANT" in
  import)       node --import ./instrument.mjs app.mjs > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  require-cjs)  node --require ./instrument.cjs app.mjs > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  self-import)  node app-import-first.mjs > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  node-options) NODE_OPTIONS="--import ./instrument.mjs" node app.mjs > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  *) echo "unknown variant $VARIANT"; kill $SINK_PID; exit 1 ;;
esac
APP_PID=$!

for _ in $(seq 1 100); do curl -s -o /dev/null "$APP/nope" && break; sleep 0.1; done

curl -s "$APP/debug-sentry" >/dev/null
curl -s "$APP/debug-span"   >/dev/null
curl -s "$APP/debug-log"    >/dev/null
curl -s "$APP/sentinel"     >/dev/null

# Wait until the sentinel message and the (timer-flushed) log batch have arrived. No fixed sleeps.
for _ in $(seq 1 300); do
  if curl -s "$SINK/__items" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const sentinel=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const sentinelSpan=i.some(x=>x.type==="span"&&(x.raw||[]).some(r=>String(r.url||"").endsWith("/sentinel")));
  const log=i.some(x=>x.type==="log");
  process.exit(sentinel&&sentinelSpan&&log?0:1);
})'; then break; fi
  sleep 0.2
done

node -e '
const [items,rawItems,headers]=process.argv.slice(1);
Promise.all([items,rawItems,headers].map(u=>fetch(u).then(r=>r.json()))).then(([i,r,h])=>{
  console.log(JSON.stringify({variant:process.env.V,items:i,spansRaw:r.filter(x=>x.header.type==="span").map(x=>x.payload),recorderHeaders:h},null,2));
});' "$SINK/__items" "$SINK/__items?raw=1" "$SINK/__headers" > "$DIR/results-$VARIANT.json"
V="$VARIANT" node -e '
const fs=require("fs");
const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));j.variant=process.env.V;fs.writeFileSync(process.argv[1],JSON.stringify(j,null,2));' "$DIR/results-$VARIANT.json"

kill $APP_PID 2>/dev/null; wait $APP_PID 2>/dev/null
kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/results-$VARIANT.json (app log: app-$VARIANT.log)"
