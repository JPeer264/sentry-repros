#!/bin/bash
# usage: ./run2.sh <bun binary> <dist dir> <tag>
set -u
BUN="$1"; DIST="$2"; TAG="$3"
SINK_PORT="${SINK_PORT:-45231}"
APP_PORT="${APP_PORT:-45251}"

curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null
SINK_PORT=$SINK_PORT APP_PORT=$APP_PORT "$BUN" "$DIST/app-lazy-keep.js" > "app-$TAG-lazy-keep.out" 2>&1 &
pid=$!
for _ in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:$APP_PORT/" && break
  sleep 0.3
done
node drive.mjs "$APP_PORT" "$SINK_PORT" sentinel > "log-$TAG-lazy-keep.txt" 2>&1
kill $pid; wait $pid 2>/dev/null
echo "=== $TAG lazy-keep"; cat "log-$TAG-lazy-keep.txt"
