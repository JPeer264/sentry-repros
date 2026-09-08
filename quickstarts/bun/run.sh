#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   preload      bun --preload ./instrument.ts app.ts          (the documented way)
#   bunfig       bun app.ts, with preload = ["./instrument.ts"] in bunfig.toml
#   self-import  bun app-import-first.ts                       (import "./instrument" as first line)
#   bundle       bun run build.ts && bun --preload ./instrument.ts dist/app.js
#   bundle-minimal  same, but build-minimal.ts leaves out `external: ["@sentry/*"]`
#   watch        bun --watch --preload ./instrument.ts app.ts
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-preload}"
SINK_PORT="${SINK_PORT:-41417}"
APP_PORT="${APP_PORT:-41418}"
SINK="http://127.0.0.1:${SINK_PORT}"
APP="http://127.0.0.1:${APP_PORT}"
NOCFG="--config=$DIR/bunfig-none.toml"

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

export SENTRY_TUNNEL="$SINK/"
export RECORDER_URL="$SINK"
export APP_PORT

cd "$DIR"
case "$VARIANT" in
  preload)     bun $NOCFG --preload ./instrument.ts app.ts > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  bunfig)      bun app.ts > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  self-import) bun $NOCFG app-import-first.ts > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  bundle)      bun $NOCFG run build.ts > "$DIR/build-$VARIANT.log" 2>&1
               bun $NOCFG --preload ./instrument.ts dist/app.js > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  bundle-minimal)
               bun $NOCFG run build-minimal.ts > "$DIR/build-$VARIANT.log" 2>&1
               bun $NOCFG --preload ./instrument.ts dist-minimal/app.js > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  watch)       bun $NOCFG --watch --preload ./instrument.ts app.ts > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  *) echo "unknown variant $VARIANT"; kill $SINK_PID; exit 1 ;;
esac
APP_PID=$!

for _ in $(seq 1 150); do curl -s -o /dev/null "$APP/nope" && break; sleep 0.1; done

curl -s "$APP/users/42"     >/dev/null
curl -s "$APP/debug-sentry" >/dev/null
curl -s "$APP/debug-span"   >/dev/null
curl -s "$APP/debug-log"    >/dev/null
curl -s "$APP/sentinel"     >/dev/null

# Wait until the sentinel event, its server span and the timer-flushed log batch have arrived. No fixed sleeps.
for _ in $(seq 1 400); do
  if curl -s "$SINK/__items" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  const i=JSON.parse(s);
  const sentinel=i.some(x=>x.type==="event"&&x.message==="sentinel");
  const sentinelSpan=i.some(x=>x.type==="span"&&(x.raw||[]).some(r=>String(r.url||"").includes("/sentinel")||String(r.name||"").includes("/sentinel")));
  const log=i.some(x=>x.type==="log");
  process.exit(sentinel&&sentinelSpan&&log?0:1);
})'; then break; fi
  sleep 0.2
done

V="$VARIANT" node -e '
const [items,rawItems,headers]=process.argv.slice(1);
Promise.all([items,rawItems,headers].map(u=>fetch(u).then(r=>r.json()))).then(([i,r,h])=>{
  console.log(JSON.stringify({variant:process.env.V,items:i,spansRaw:r.filter(x=>x.header.type==="span").map(x=>x.payload),recorderHeaders:h},null,2));
});' "$SINK/__items" "$SINK/__items?raw=1" "$SINK/__headers" > "$DIR/results-$VARIANT.json"

kill $APP_PID 2>/dev/null; wait $APP_PID 2>/dev/null
kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/results-$VARIANT.json (app log: app-$VARIANT.log)"
