#!/usr/bin/env bash
# usage: bash run.sh <app file> <sink port> <app port> <label> [bun binary]
set -u
here="$(cd "$(dirname "$0")" && pwd)"
app="$1"; sink_port="$2"; app_port="$3"; label="$4"; bunbin="${5:-bun}"

PORT="$sink_port" node "$here/sink.mjs" > "$here/sink-$label.log" 2>&1 &
sink_pid=$!
sleep 1
if ! kill -0 $sink_pid 2>/dev/null; then
  echo "sink failed to start on port $sink_port (already in use?)"; cat "$here/sink-$label.log"; exit 1
fi

SINK_PORT="$sink_port" PORT="$app_port" "$bunbin" "$here/$app" > "$here/app-$label.log" 2>&1 &
app_pid=$!

for _ in $(seq 1 40); do
  if curl -s -o /dev/null "http://127.0.0.1:$app_port/ping"; then break; fi
  sleep 0.25
done

node "$here/drive.mjs" "$app_port" "$sink_port" "$label" > "$here/drive-$label.log" 2>&1
curl -s "http://127.0.0.1:$sink_port/__items?raw=1" > "$here/raw-$label.log"

kill $app_pid; wait $app_pid 2>/dev/null
kill $sink_pid; wait $sink_pid 2>/dev/null

cat "$here/drive-$label.log"
