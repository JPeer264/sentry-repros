#!/bin/bash
# usage: run.sh <mode:off|custom|route> <lifecycle:stream|static> <tag>
set -u
D=$REPRO/refutations/verify4-M-fresh-cf-routenames
MODE=$1; LC=$2; TAG=$3
SINK=41337; APP=41338
PORT=$SINK node $D/sink.mjs > $D/sink-$TAG.log 2>&1 &
SINKPID=$!
cd $D/app
npx wrangler dev --port $APP --inspector-port 0 \
  --var ROUTEMODE:$MODE --var LIFECYCLE:$LC --var SINKPORT:$SINK \
  > $D/wrangler-$TAG.log 2>&1 &
WPID=$!
for i in $(seq 1 90); do
  grep -q "Ready on http" $D/wrangler-$TAG.log && break
  sleep 1
done
if ! grep -q "Ready on http" $D/wrangler-$TAG.log; then
  echo "NOT READY"; tail -20 $D/wrangler-$TAG.log
  kill $WPID 2>/dev/null; wait $WPID 2>/dev/null
  kill $SINKPID 2>/dev/null; wait $SINKPID 2>/dev/null
  exit 1
fi
curl -s -o /dev/null "http://127.0.0.1:$APP/users/42"
curl -s -o /dev/null "http://127.0.0.1:$APP/iso/abc"
curl -s -o /dev/null "http://127.0.0.1:$APP/"
curl -s -o /dev/null "http://127.0.0.1:$APP/boom"
for i in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:$APP/sentinel?n=$TAG"
  sleep 1
  if curl -s "http://127.0.0.1:$SINK/__items" | grep -q "sentinel-$TAG"; then break; fi
done
curl -s "http://127.0.0.1:$SINK/__items" > $D/items-$TAG.json
curl -s "http://127.0.0.1:$SINK/__items?raw=1" > $D/raw-$TAG.json
kill $WPID 2>/dev/null; wait $WPID 2>/dev/null
kill $SINKPID 2>/dev/null; wait $SINKPID 2>/dev/null
echo "done $TAG"
