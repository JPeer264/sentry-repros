#!/bin/bash
# usage: ./run-phase.sh <label> <workdir> <start command...>
#   ./run-phase.sh run    .    deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts
#   ./run-phase.sh binary /tmp/bin ./app
# Starts the app in <workdir>, drives it, and writes run-<label>.log / drive-<label>.log /
# items-<label>.json next to this script. APP_PORT and SINK_PORT come from the environment.
set -e
here=$(cd "$(dirname "$0")" && pwd)
label=$1; shift
workdir=$1; shift

# `exec` so that $! is the app itself and `kill $pid` below really stops the server.
(cd "$workdir" && exec env APP_PORT=$APP_PORT SINK_PORT=$SINK_PORT "$@") > "$here/run-$label.log" 2>&1 &
pid=$!

for _ in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:$APP_PORT/sentinel?n=0" && break
  sleep 0.5
done

node "$here/drive.mjs" "$APP_PORT" "$SINK_PORT" > "$here/items-$label.json" 2> "$here/drive-$label.log"

kill $pid
wait $pid 2>/dev/null || true
