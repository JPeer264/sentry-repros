#!/usr/bin/env bash
# usage: bash run.sh <cached|uncached> <sinkPort> <appPort> <label>
set -euo pipefail
variant="$1"; sinkPort="$2"; appPort="$3"; label="$4"
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/logs-$variant-$label"
mkdir -p "$out"

PORT="$sinkPort" node "$here/sink.mjs" > "$out/sink.log" 2>&1 & spid=$!
sleep 1

vars=(--var "SINK_PORT:$sinkPort")
if [ "$variant" = "uncached" ]; then vars+=(--var UNCACHED:1); fi

( cd "$here" && npx wrangler dev --port "$appPort" --inspector-port 0 \
    --persist-to "./persist-$variant" "${vars[@]}" ) > "$out/app.log" 2>&1 & apid=$!

for _ in $(seq 1 60); do
  grep -q "Ready on http://localhost:$appPort" "$out/app.log" && break
  sleep 1
done

node "$here/drive.mjs" "$appPort" "$sinkPort" > "$out/drive.out" 2>&1 || true

kill $apid; wait $apid || true
kill $spid; wait $spid || true

cat "$out/drive.out"
