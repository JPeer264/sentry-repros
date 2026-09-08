#!/usr/bin/env bash
# Side check for run.sh variant (b): are library (express) spans present when the
# instrument file is imported as the entry's first line instead of via --import?
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-flag}"
SINK_PORT="${SINK_PORT:-41317}"; APP_PORT="${APP_PORT:-41318}"
SINK="http://127.0.0.1:$SINK_PORT"; APP="http://127.0.0.1:$APP_PORT"
PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-express-$MODE.log" 2>&1 & SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done
export SENTRY_TUNNEL="$SINK/" RECORDER_URL="$SINK" APP_PORT
cd "$DIR"
if [ "$MODE" = "flag" ]; then
  node --import ./instrument.mjs probe-express.mjs > "$DIR/app-express-$MODE.log" 2>&1 & 
else
  node probe-express-self-import.mjs > "$DIR/app-express-$MODE.log" 2>&1 &
fi
APP_PID=$!
for _ in $(seq 1 100); do curl -s -o /dev/null "$APP/users/42" && break; sleep 0.1; done
curl -s "$APP/users/42" >/dev/null
curl -s "$APP/sentinel" >/dev/null
for _ in $(seq 1 200); do
  curl -s "$SINK/__items" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const i=JSON.parse(s);const ev=i.some(x=>x.type==="event"&&x.message==="sentinel");const sp=i.some(x=>x.type==="span"&&(x.raw||[]).some(r=>String(r.url||"").endsWith("/sentinel")));process.exit(ev&&sp?0:1)})' && break
  sleep 0.2
done
curl -s "$SINK/__items" > "$DIR/results-express-$MODE.json"
kill $APP_PID 2>/dev/null; wait $APP_PID 2>/dev/null
kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote results-express-$MODE.json"
