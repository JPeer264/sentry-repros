#!/bin/bash
# Usage: SINK_PORT=51431 DS_PORT=51432 BUN_PORT=51433 NODE_PORT=51434 LIFECYCLE=static ./run.sh
set -u
export SINK_PORT=${SINK_PORT:-51431}
export DS_PORT=${DS_PORT:-51432}
export BUN_PORT=${BUN_PORT:-51433}
export NODE_PORT=${NODE_PORT:-51434}
export LIFECYCLE=${LIFECYCLE:-stream}
cd "$(dirname "$0")"

PORT=$SINK_PORT node sink.mjs > sink.log 2>&1 & sink_pid=$!
PORT=$DS_PORT node downstream.mjs > downstream.log 2>&1 & ds_pid=$!
bun app.ts > app.log 2>&1 & app_pid=$!

for _ in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:$BUN_PORT/health" && break
  sleep 0.25
done

curl -s -o /dev/null -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1-bbbbbbbbbbbbbbb1-1' \
  -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1,sentry-sample_rate=1' \
  "http://127.0.0.1:$BUN_PORT/out"
curl -s -o /dev/null -H 'sentry-trace: ccccccccccccccccccccccccccccccc2-ddddddddddddddd2-1' \
  -H 'baggage: sentry-trace_id=ccccccccccccccccccccccccccccccc2,sentry-sample_rate=1' \
  "http://127.0.0.1:$NODE_PORT/out"

# sentinels: everything sent before them has arrived once both are in the sink
curl -s -o /dev/null "http://127.0.0.1:$BUN_PORT/sentinel"
curl -s -o /dev/null "http://127.0.0.1:$NODE_PORT/sentinel"

for _ in $(seq 1 80); do
  body=$(curl -s "http://127.0.0.1:$SINK_PORT/__items")
  # the two incoming trace ids must be in the sink too: span envelopes are flushed on a timer,
  # so the sentinel events can land before them
  if [[ "$body" == *sentinel-bun* && "$body" == *sentinel-node* \
     && "$body" == *aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1* && "$body" == *ccccccccccccccccccccccccccccccc2* ]]; then break; fi
  sleep 0.5
done

echo "--- items (LIFECYCLE=$LIFECYCLE)"
curl -s "http://127.0.0.1:$SINK_PORT/__items" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const i of JSON.parse(s))console.log(JSON.stringify(i))})'
echo "--- downstream headers"
curl -s "http://127.0.0.1:$DS_PORT/__headers" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const i of JSON.parse(s))console.log(JSON.stringify(i))})'

kill $app_pid; kill $ds_pid; kill $sink_pid
wait $app_pid 2>/dev/null; wait $ds_pid 2>/dev/null; wait $sink_pid 2>/dev/null
