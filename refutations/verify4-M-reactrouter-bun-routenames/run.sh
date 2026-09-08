#!/bin/bash
# usage: run.sh <runtime-bin> <lifecycle> <label>
set -u
S=$SCRATCH
D=$REPRO/refutations/verify4-M-reactrouter-bun-routenames
BIN=$1; LC=$2; LABEL=$3
PORT=41824
curl -s -X DELETE http://127.0.0.1:41823/__items > /dev/null
cd $D/app
PORT=$PORT TRACE_LIFECYCLE=$LC SENTRY_DEBUG=${SENTRY_DEBUG:-0} NODE_ENV=production $BIN server.js > $D/app-$LABEL.log 2>&1 &
pid=$!
for i in $(seq 1 60); do
  if grep -q "Server is running" $D/app-$LABEL.log 2>/dev/null; then break; fi
  sleep 0.5
done
echo "--- boot log ---"; head -20 $D/app-$LABEL.log
echo "--- GET /users/1 ---"; curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:$PORT/users/1"
echo "--- GET /users/1 body ---"; curl -s "http://127.0.0.1:$PORT/users/1" | grep -o 'active=[^<]*' | head -1
echo "--- GET /users/1?mode=error ---"; curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:$PORT/users/1?mode=error"
echo "--- GET / ---"; curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:$PORT/"
echo "--- sentinel ---"; curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:$PORT/flush"
for i in $(seq 1 40); do
  if curl -s http://127.0.0.1:41823/__items | grep -q sentinel; then break; fi
  sleep 0.5
done
sleep 2
curl -s http://127.0.0.1:41823/__items > $D/items-$LABEL.json
curl -s "http://127.0.0.1:41823/__items?raw" > $D/raw-$LABEL.json
kill $pid; wait $pid 2>/dev/null
echo "--- done $LABEL ---"
