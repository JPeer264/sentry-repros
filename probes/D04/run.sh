#!/bin/sh
# usage: ./run.sh <sinkPort> <appPort(Deno.serve)> <httpPort(node:http)> <recorderPort> [stream|static]
set -u
dir=$(cd "$(dirname "$0")" && pwd)
SINK=$1; APP=$2; HTTP=$3; REC=$4; LIFECYCLE=${5:-stream}

TRACE_HEADER="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-bbbbbbbbbbbbbbbb-1"
BAGGAGE_HEADER="sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true,sentry-environment=upstreamenv,sentry-transaction=upstream-tx"

PORT=$SINK node "$dir/sink.mjs" > "$dir/sink.log" 2>&1 &
sink_pid=$!
PORT=$REC node "$dir/recorder.mjs" > "$dir/recorder.log" 2>&1 &
rec_pid=$!
SINK_PORT=$SINK APP_PORT=$APP HTTP_PORT=$HTTP REC_PORT=$REC LIFECYCLE=$LIFECYCLE \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$dir/main.ts" > "$dir/app.log" 2>&1 &
app_pid=$!

i=0
while [ $i -lt 60 ]; do
  curl -s -o /dev/null "http://127.0.0.1:$APP/" && curl -s -o /dev/null "http://127.0.0.1:$HTTP/" && break
  i=$((i+1)); curl -s -o /dev/null "http://127.0.0.1:$SINK/__items" > /dev/null
done

echo "== driving (lifecycle=$LIFECYCLE)"
curl -s -H "sentry-trace: $TRACE_HEADER" -H "baggage: $BAGGAGE_HEADER" "http://127.0.0.1:$APP/probe"
curl -s -H "sentry-trace: $TRACE_HEADER" -H "baggage: $BAGGAGE_HEADER" "http://127.0.0.1:$HTTP/probe"
curl -s -o /dev/null "http://127.0.0.1:$APP/sentinel"
curl -s -o /dev/null "http://127.0.0.1:$HTTP/sentinel"

# wait until both sentinel events are in the sink
i=0
while [ $i -lt 120 ]; do
  n=$(curl -s "http://127.0.0.1:$SINK/__items" | python3 -c 'import json,sys;print(sum(1 for i in json.load(sys.stdin) if i.get("type")=="event"))')
  [ "$n" -ge 2 ] && break
  i=$((i+1))
  curl -s -o /dev/null "http://127.0.0.1:$SINK/__items"
done

echo "== recorder (downstream headers)"
curl -s "http://127.0.0.1:$REC/__recorded" | python3 -c 'import json,sys;[print(json.dumps(i)) for i in json.load(sys.stdin)]'
echo "== sink"
curl -s "http://127.0.0.1:$SINK/__items" | python3 -c 'import json,sys;[print(json.dumps(i)) for i in json.load(sys.stdin)]'
echo "== app log"
grep ACTIVE "$dir/app.log"

kill $app_pid; kill $rec_pid; kill $sink_pid
wait $app_pid 2>/dev/null
wait $rec_pid 2>/dev/null
wait $sink_pid 2>/dev/null
true
