#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   quickstart        deno run --allow-net --allow-env --allow-read=. --allow-sys=hostname,osRelease main.ts
#   guide-flags       deno run --no-prompt --allow-net main.ts                  (index.mdx flags only)
#   guide-flags-nohook deno run --no-prompt --allow-net main-no-hook.ts
#   no-hook           quickstart flags, main-no-hook.ts (no `@sentry/deno/import` line)
#   import-flag       quickstart flags + --import=./node_modules/@sentry/deno/build/import.mjs main-no-hook.ts
#   deno-serve        deno serve ... serve.ts (export default { fetch })
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-quickstart}"
SINK_PORT="${SINK_PORT:-44219}"
APP_PORT="${APP_PORT:-44220}"
SINK="http://127.0.0.1:${SINK_PORT}"
APP="http://127.0.0.1:${APP_PORT}"
PERMS="--allow-net --allow-env --allow-read=. --allow-sys=hostname,osRelease"

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

export SENTRY_TUNNEL="$SINK/"
export RECORDER_URL="$SINK"
export APP_PORT

cd "$DIR"
case "$VARIANT" in
  quickstart)         deno run $PERMS main.ts > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  guide-flags)        deno run --no-prompt --allow-net main.ts > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  guide-flags-nohook) deno run --no-prompt --allow-net main-no-hook.ts > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  no-hook)            deno run $PERMS main-no-hook.ts > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  import-flag)        deno run $PERMS --import=./node_modules/@sentry/deno/build/import.mjs main-no-hook.ts > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  deno-serve)         deno serve $PERMS --port "$APP_PORT" --host 127.0.0.1 serve.ts > "$DIR/app-$VARIANT.log" 2>&1 & ;;
  *) echo "unknown variant $VARIANT"; kill $SINK_PID; exit 1 ;;
esac
APP_PID=$!

READY=no
for _ in $(seq 1 150); do
  curl -s -o /dev/null "$APP/nope" && { READY=yes; break; }
  kill -0 $APP_PID 2>/dev/null || break
  sleep 0.1
done

if [ "$READY" = yes ]; then
  curl -s "$APP/users/42"    >/dev/null
  curl -s "$APP/debug-sentry" >/dev/null
  curl -s "$APP/debug-span"   >/dev/null
  curl -s "$APP/debug-log"    >/dev/null
  curl -s "$APP/sentinel"     >/dev/null

  # Wait for the sentinel event, its server span and the timer-flushed log batch. No fixed sleeps.
  for _ in $(seq 1 400); do
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
else
  echo "app did not become ready; see app-$VARIANT.log"
fi

V="$VARIANT" node -e '
const [items,rawItems,headers]=process.argv.slice(1);
Promise.all([items,rawItems,headers].map(u=>fetch(u).then(r=>r.json()))).then(([i,r,h])=>{
  console.log(JSON.stringify({variant:process.env.V,items:i,spansRaw:r.filter(x=>x.header.type==="span").map(x=>x.payload),eventsRaw:r.filter(x=>x.header.type==="event").map(x=>x.payload),recorderHeaders:h},null,2));
});' "$SINK/__items" "$SINK/__items?raw=1" "$SINK/__headers" > "$DIR/results-$VARIANT.json"

kill $APP_PID 2>/dev/null; wait $APP_PID 2>/dev/null
kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/results-$VARIANT.json (app log: app-$VARIANT.log)"
