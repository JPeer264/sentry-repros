#!/bin/bash
# usage: run.sh <tag> <NAMING> <LIFECYCLE> <MOUNT>
set -u
D="$(cd "$(dirname "$0")" && pwd)"
TAG=$1; NAMING=$2; LIFECYCLE=$3; MOUNT=${4:-serve}
SINK_PORT=41333; APP_PORT=41334
curl -s -X DELETE http://127.0.0.1:$SINK_PORT/__items > /dev/null
cd "$D"
SINK_PORT=$SINK_PORT APP_PORT=$APP_PORT NAMING=$NAMING LIFECYCLE=$LIFECYCLE MOUNT=$MOUNT \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts > "$D/app-$TAG.log" 2>&1 &
pid=$!
for i in $(seq 1 60); do grep -q "ready" "$D/app-$TAG.log" && break; sleep 0.5; done
sleep 0.5
curl -s "http://127.0.0.1:$APP_PORT/users/7" > /dev/null
curl -s "http://127.0.0.1:$APP_PORT/ok" > /dev/null
curl -s "http://127.0.0.1:$APP_PORT/error/42" > /dev/null
curl -s "http://127.0.0.1:$APP_PORT/sentinel" > /dev/null
for i in $(seq 1 40); do
  curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q sentinel && break
  sleep 0.5
done
sleep 2
curl -s "http://127.0.0.1:$SINK_PORT/__items" > "$D/items-$TAG.json"
kill $pid 2>/dev/null; wait $pid 2>/dev/null
echo "--- $TAG done"
