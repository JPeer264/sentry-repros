#!/bin/bash
# usage: ./run-d09.sh <label> [ENV=VAL ...]
#   e.g. ./run-d09.sh default
#        ./run-d09.sh static LIFECYCLE=static
#        ./run-d09.sh maxsize-small LIFECYCLE=static MAXSIZE=small BODYSIZE=2000
set -e
cd "$(dirname "$0")"
label=$1; shift
for kv in "$@"; do export "$kv"; done

sink_port=$((20000 + RANDOM % 20000))
app_port=$((40000 + RANDOM % 19000))

PORT=$sink_port node sink-d09.mjs > "sink-$label.log" 2>&1 &
sink_pid=$!

APP_PORT=$app_port SINK_PORT=$sink_port \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys probe.ts \
  > "app-$label.log" 2>&1 &
app_pid=$!

for i in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:$app_port/sentinel" && break
  sleep 0.5
done

node drive-d09.mjs "$app_port" "$sink_port" "${BODYSIZE:-0}" \
  > "result-$label.json" 2> "drive-$label.log"

kill $app_pid; wait $app_pid 2>/dev/null || true
kill $sink_pid; wait $sink_pid 2>/dev/null || true

echo "wrote result-$label.json (app port $app_port, sink port $sink_port)"
