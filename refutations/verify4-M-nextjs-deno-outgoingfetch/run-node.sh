#!/bin/bash
# usage: run.sh <tag> <FETCH_INT> <TRACE_LIFECYCLE> <app-port>
set -u
TAG=$1; FI=$2; TL=$3; PORT=$4
SINK=47311; REC=53471
cd "$(dirname "$0")"
curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
FETCH_INT=$FI TRACE_LIFECYCLE=$TL SINK_PORT=$SINK RECORDER_PORT=$REC \
  node node_modules/next/dist/bin/next start -p $PORT > server-$TAG.log 2>&1 &
APP=$!
for i in $(seq 1 60); do
  if curl -s -o /dev/null http://127.0.0.1:$PORT/api/sentinel 2>/dev/null; then break; fi
  sleep 1
done
curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
echo "--- app response: $(curl -s http://127.0.0.1:$PORT/api/fetch)"
curl -s -o /dev/null http://127.0.0.1:$PORT/api/sentinel
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:$SINK/__items | grep -q sentinel; then break; fi
  sleep 1
done
echo "--- sink items ($TAG):"
curl -s http://127.0.0.1:$SINK/__items > sink-$TAG.json
cat sink-$TAG.json
echo
echo "--- recorder hits:"
curl -s http://127.0.0.1:$REC/__hits > rec-$TAG.json
cat rec-$TAG.json
echo
kill $APP; wait $APP 2>/dev/null
echo "--- done $TAG"
