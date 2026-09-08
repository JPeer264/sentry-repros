#!/bin/sh
# usage: ./run.sh <variant-dir> <sink-port> <app-port> [debug 0|1]
set -u
dir=$(cd "$(dirname "$0")" && pwd)
variant=$1
sinkPort=$2
appPort=$3
debug=${4:-0}
curl -s -X DELETE "http://127.0.0.1:$sinkPort/__items" > /dev/null
echo "== $variant (debug=$debug)"
SINK_PORT=$sinkPort APP_PORT=$appPort SENTRY_DEBUG=$debug \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys \
  --config "$dir/$variant/deno.json" "$dir/$variant/main.ts" > "$dir/$variant/app.log" 2>&1 &
pid=$!
for i in $(seq 1 60); do
  grep -q "APP_READY" "$dir/$variant/app.log" 2>/dev/null && break
  sleep 0.5
done
node "$dir/drive.mjs" "$appPort" "$sinkPort"
kill $pid 2>/dev/null
wait $pid 2>/dev/null
echo "-- app.log:"
sed 's/\x1b\[[0-9;]*m//g' "$dir/$variant/app.log"
