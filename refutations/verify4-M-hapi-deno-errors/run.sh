#!/bin/bash
# usage: run.sh <entry> <appport> <label> [extra env assignments...]
set -u
D="$(cd "$(dirname "$0")" && pwd)"
ENTRY=$1; APPPORT=$2; LABEL=$3; shift 3
SINK=52831
curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
cd "$D"
env "$@" TUNNEL="http://127.0.0.1:$SINK/" PORT=$APPPORT \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$ENTRY" > "run-$LABEL.log" 2>&1 &
pid=$!
for i in $(seq 1 60); do
  grep -q "^PORT=" "run-$LABEL.log" 2>/dev/null && break
  sleep 0.5
done
if ! grep -q "^PORT=" "run-$LABEL.log"; then
  echo "=== $LABEL: APP DID NOT BOOT ==="
  kill $pid 2>/dev/null; wait $pid 2>/dev/null
  head -20 "run-$LABEL.log"
  exit 1
fi
APP_PORT=$APPPORT node drive.mjs
for i in $(seq 1 40); do
  curl -s http://127.0.0.1:$SINK/__items | grep -q '"sentinel"' && break
  sleep 0.5
done
sleep 1
echo "=== $LABEL sink ==="
curl -s http://127.0.0.1:$SINK/__items | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const i of JSON.parse(s))console.log(JSON.stringify(i))})'
kill $pid 2>/dev/null; wait $pid 2>/dev/null
