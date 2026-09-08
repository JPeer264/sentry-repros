#!/bin/zsh
set -e
D=$REPRO/refutations/verify4-M-fresh-bun-routenames
SINK=41871
APP=41873
LIFECYCLE=$1
VARIANT=$2
TAG=$3
ENTRY=$4
cd $D
LIFECYCLE=$LIFECYCLE VARIANT=$VARIANT SINK_PORT=$SINK PORT=$APP bun $ENTRY > $D/app-$TAG.log 2>&1 &
pid=$!
for i in $(seq 1 60); do
  if grep -q "fresh-on-bun listening" $D/app-$TAG.log 2>/dev/null; then break; fi
  sleep 0.5
done
curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
echo "--- GET /users/42 ->" $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APP/users/42)
echo "--- GET /sentinel ->" $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APP/sentinel)
for i in $(seq 1 60); do
  if curl -s http://127.0.0.1:$SINK/__items | grep -q '"sentinel"'; then break; fi
  sleep 0.5
done
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:$SINK/__items | grep -q '"span"'; then break; fi
  sleep 0.5
done
sleep 2
curl -s http://127.0.0.1:$SINK/__items > $D/items-$TAG.json
kill $pid; wait $pid 2>/dev/null || true
