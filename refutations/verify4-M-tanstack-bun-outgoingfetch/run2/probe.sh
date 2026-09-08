#!/bin/bash
# usage: probe.sh <variant> <lifecycle> <runtime: bun|node> <tag>
set -u
S=$SCRATCH
D=$REPRO/refutations/verify4-M-tanstack-bun-outgoingfetch
VARIANT=$1; LIFECYCLE=$2; RT=$3; TAG=$4
SINK=52117; REC=52118; APP=52119

curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
curl -s -X DELETE http://127.0.0.1:$REC/__seen > /dev/null

cd $D/app2
if [ "$RT" = "bun" ]; then
  PROBE_VARIANT=$VARIANT PROBE_LIFECYCLE=$LIFECYCLE PROBE_DEBUG=1 SINK_PORT=$SINK RECORDER_PORT=$REC PORT=$APP \
    bun --preload ./instrument.server.mjs .output/server/index.mjs > $D/run2/app-$TAG.log 2>&1 &
else
  PROBE_VARIANT=$VARIANT PROBE_LIFECYCLE=$LIFECYCLE PROBE_DEBUG=1 SINK_PORT=$SINK RECORDER_PORT=$REC PORT=$APP \
    node --import ./instrument.server.mjs .output/server/index.mjs > $D/run2/app-$TAG.log 2>&1 &
fi
pid=$!
for i in $(seq 1 60); do
  if curl -s -m 1 http://127.0.0.1:$APP/api/ping > /dev/null 2>&1; then break; fi
  sleep 0.5
done
echo "--- ping: $(curl -s http://127.0.0.1:$APP/api/ping)"
echo "--- fetch: $(curl -s http://127.0.0.1:$APP/api/fetch)"
echo "--- sentinel: $(curl -s http://127.0.0.1:$APP/api/sentinel)"
sleep 2
echo "--- recorder seen:"; curl -s http://127.0.0.1:$REC/__seen
echo "--- sink items:"; curl -s http://127.0.0.1:$SINK/__items
kill $pid 2>/dev/null; wait $pid 2>/dev/null
echo "--- done $TAG"
