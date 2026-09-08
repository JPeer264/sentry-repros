#!/bin/bash
# usage: ./run.sh <entry.ts> <label> [sinkPort] [mockPort] [appPort]
set -u
cd "$(dirname "$0")"
entry=$1
label=$2
sink_port=${3:-41317}
mock_port=${4:-41318}
app_port=${5:-41319}

RAW_FILE="raw-$label.ndjson" PORT=$sink_port node sink.mjs > "sink-$label.log" 2>&1 & sink_pid=$!
PORT=$mock_port node mock.mjs > "mock-$label.log" 2>&1 & mock_pid=$!
sleep 1

SINK_PORT=$sink_port MOCK_PORT=$mock_port APP_PORT=$app_port \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$entry" > "app-$label.log" 2>&1 & app_pid=$!

for _ in $(seq 1 40); do
  grep -q "app listening" "app-$label.log" && break
  sleep 0.5
done

node drive.mjs "$app_port" "$sink_port" > "items-$label.log" 2>&1

echo "== $label ($entry)"
cat "items-$label.log"
echo "== mock:"
cat "mock-$label.log"

kill $app_pid 2>/dev/null; wait $app_pid 2>/dev/null
kill $sink_pid 2>/dev/null; wait $sink_pid 2>/dev/null
kill $mock_pid 2>/dev/null; wait $mock_pid 2>/dev/null
