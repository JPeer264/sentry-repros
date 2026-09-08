#!/bin/bash
# usage: run.sh <config> <app-port> <sink-port> <app-log> <drive-out>
set -u
cfg=$1; appPort=$2; sinkPort=$3; appLog=$4; driveOut=$5
dir="$(cd "$(dirname "$0")" && pwd)"
cd "$dir" || exit 1
./node_modules/.bin/wrangler dev --config "$cfg" --port "$appPort" --inspector-port 0 \
  --var "SINK_URL:http://127.0.0.1:${sinkPort}/" > "$appLog" 2>&1 &
apid=$!
for i in $(seq 1 90); do
  grep -q "Ready on http://localhost:${appPort}" "$appLog" && break
  sleep 1
done
node "$dir/drive.mjs" "$appPort" "$sinkPort" > "$driveOut" 2>&1
kill $apid 2>/dev/null
wait $apid 2>/dev/null
