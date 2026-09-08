#!/bin/bash
# usage: ./run.sh <entry .ts> <0|1 error listener> <app port> <sink port> <label>
set -e
entry=$1; listener=$2; app_port=$3; sink_port=$4; label=$5

APP_PORT=$app_port SINK_PORT=$sink_port OAK_ERROR_LISTENER=$listener \
  deno run --no-lock --no-prompt --allow-net --allow-env --allow-read --allow-sys "$entry" \
  > "app-$label.log" 2>&1 &
pid=$!

for i in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:$app_port/user/1" && break
  sleep 0.5
done
# Let the readiness request's span envelope flush before drive.mjs clears the sink.
sleep 2

node drive.mjs "$app_port" "$sink_port" > "$label.items.json" 2> "drive-$label.log"
node verify.mjs "$label.items.json" | tee "verify-$label.txt"

kill $pid
wait $pid 2>/dev/null || true
