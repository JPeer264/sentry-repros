#!/bin/bash
# usage: ./run.sh <serve|http> <app port> <sink port> <run label>
set -e
mode=$1; app_port=$2; sink_port=$3; label=$4
entry="main-$mode.ts"

APP_PORT=$app_port SINK_PORT=$sink_port \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$entry" \
  > "app-$mode-$label.log" 2>&1 &
pid=$!

for i in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:$app_port/sentinel?n=0" && break
  sleep 0.5
done

node drive.mjs "$app_port" "$sink_port" > "$mode-result-$label.json" 2> "drive-$mode-$label.log"
node verify.mjs "$mode-result-$label.json" | tee "verify-$mode-$label.txt"

kill $pid
wait $pid 2>/dev/null || true
