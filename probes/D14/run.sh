#!/bin/bash
# usage: ./run.sh <label> <main file> <static|stream> <sink port> <app port> [comma separated paths]
set -u
label=$1; main=$2; lifecycle=$3; sink_port=$4; app_port=$5; paths=${6:-}

PORT=$sink_port RAW="raw-$label.ndjson" node sink.mjs > "sink-$label.log" 2>&1 &
sink_pid=$!

PORT=$app_port SINK=$sink_port TRACE_LIFECYCLE=$lifecycle \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$main" \
  > "app-$label.log" 2>&1 &
app_pid=$!

for _ in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:$app_port/hello/world" && break
  sleep 0.5
done

node drive.mjs "$app_port" "$sink_port" "$paths" > "drive-$label.out" 2>&1

kill $app_pid 2>/dev/null
wait $app_pid 2>/dev/null
kill $sink_pid 2>/dev/null
wait $sink_pid 2>/dev/null
echo "done $label"
