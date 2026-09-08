#!/bin/bash
# usage: run2.sh <runtime-bin> <lifecycle> <label>
set -u
S=$SCRATCH
D=$S/deep/verify4-M-reactrouter-bun-routenames
BIN=$1; LC=$2; LABEL=$3
SINK=53411; PORT=53412
curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
cd $D/app
PORT=$PORT SINK=$SINK TRACE_LIFECYCLE=$LC SENTRY_DEBUG=${SENTRY_DEBUG:-0} NODE_ENV=production $BIN server.js > $D/v2-app-$LABEL.log 2>&1 &
pid=$!
for i in $(seq 1 60); do
  grep -q "Server is running" $D/v2-app-$LABEL.log 2>/dev/null && break
  sleep 0.5
done
echo "--- boot ---"; head -4 $D/v2-app-$LABEL.log
echo "--- loader active span probe (GET /users/1) ---"
curl -s "http://127.0.0.1:$PORT/users/1" | grep -o 'id="probe"[^<]*' | head -1
echo "--- GET /users/42 -> $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$PORT/users/42)"
echo "--- GET /users/1?mode=error -> $(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/users/1?mode=error")"
echo "--- GET / -> $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$PORT/)"
echo "--- sentinel -> $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$PORT/flush)"
for i in $(seq 1 40); do
  curl -s http://127.0.0.1:$SINK/__items | grep -q sentinel && break
  sleep 0.5
done
sleep 2
curl -s http://127.0.0.1:$SINK/__items > $D/v2-items-$LABEL.json
kill $pid; wait $pid 2>/dev/null
echo "--- done $LABEL ---"
