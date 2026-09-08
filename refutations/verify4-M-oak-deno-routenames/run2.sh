#!/bin/bash
set -u
D="$(cd "$(dirname "$0")" && pwd)"
TAG=$1; LIFECYCLE=$2
SINK_PORT=41333; APP_PORT=41335
curl -s -X DELETE http://127.0.0.1:$SINK_PORT/__items > /dev/null
cd "$D"
SINK_PORT=$SINK_PORT APP_PORT=$APP_PORT LIFECYCLE=$LIFECYCLE \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main2.ts > "$D/app-$TAG.log" 2>&1 &
pid=$!
for i in $(seq 1 60); do grep -q "ready" "$D/app-$TAG.log" && break; sleep 0.5; done
sleep 0.5
curl -s "http://127.0.0.1:$APP_PORT/api/users/7" > /dev/null
curl -s "http://127.0.0.1:$APP_PORT/api/error/9" > /dev/null
curl -s "http://127.0.0.1:$APP_PORT/" > /dev/null
curl -s "http://127.0.0.1:$APP_PORT/nope" > /dev/null
curl -s "http://127.0.0.1:$APP_PORT/sentinel" > /dev/null
for i in $(seq 1 40); do curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q sentinel && break; sleep 0.5; done
sleep 2
curl -s "http://127.0.0.1:$SINK_PORT/__items" > "$D/items-$TAG.json"
curl -s "http://127.0.0.1:$SINK_PORT/__items?raw" > "$D/raw-$TAG.json"
kill $pid 2>/dev/null; wait $pid 2>/dev/null
echo "--- $TAG done"
