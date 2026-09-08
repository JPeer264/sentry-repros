#!/bin/bash
# usage: ./run-active.sh <app port> <sink port> <label>
set -e
app_port=$1; sink_port=$2; label=$3

APP_PORT=$app_port SINK_PORT=$sink_port \
  deno run --no-lock --no-prompt --allow-net --allow-env --allow-read --allow-sys main-active.ts \
  > "app-$label.log" 2>&1 &
pid=$!

for i in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:$app_port/active" && break
  sleep 0.5
done
# Let the readiness request's span envelope flush before drive-active.mjs clears the sink.
sleep 2

node drive-active.mjs "$app_port" "$sink_port" > "$label.items.json" 2> "drive-$label.log"
node verify.mjs "$label.items.json" | tee "verify-$label.txt"

kill $pid
wait $pid 2>/dev/null || true
