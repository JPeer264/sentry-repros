#!/bin/bash
# usage: ./run.sh <app file> <app port> <sink port>
set -u
APP=$1
APP_PORT=$2
SINK_PORT=$3

PORT=$SINK_PORT node sink.mjs > sink-$SINK_PORT.log 2>&1 &
sinkpid=$!
for i in $(seq 1 50); do
  curl -s "http://127.0.0.1:$SINK_PORT/__items" > /dev/null && break
  sleep 0.2
done

SINK_PORT=$SINK_PORT APP_PORT=$APP_PORT bun run "$APP" > app-$APP_PORT.log 2>&1 &
apppid=$!
# TCP-only readiness check: an HTTP request here would be counted as one more
# request session in the aggregate.
for i in $(seq 1 50); do
  (exec 3<>/dev/tcp/127.0.0.1/$APP_PORT) 2>/dev/null && break
  sleep 0.2
done

echo "== requests =="
for p in ok1 ok2 error sentinel; do
  echo "$p -> $(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$APP_PORT/$p")"
done

echo "== waiting for sentinel =="
for i in $(seq 1 60); do
  curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q '"sentinel"' && break
  sleep 0.5
done

echo "== sink after sentinel =="
curl -s "http://127.0.0.1:$SINK_PORT/__items"
echo

sleep 65

echo "== sink at t+65s =="
curl -s "http://127.0.0.1:$SINK_PORT/__items"
echo

echo "== stop =="
curl -s -o /dev/null -w 'stop -> %{http_code}\n' "http://127.0.0.1:$APP_PORT/stop"
wait $apppid
echo "app exit code $?"
sleep 2

echo "== sink after app exit =="
curl -s "http://127.0.0.1:$SINK_PORT/__items"
echo

echo "== app log =="
cat app-$APP_PORT.log

kill $sinkpid
wait $sinkpid 2>/dev/null
