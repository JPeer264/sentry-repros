#!/bin/sh
# usage: ./run.sh <mode: unbundled|inline|ext> <app port> <sink port>
set -e
mode=$1
port=$2
sinkport=$3

case "$mode" in
  unbundled) entry="app.ts" ;;
  inline)    entry="dist-inline/app.js" ;;
  ext)       entry="dist-ext/app.js" ;;
  *) echo "unknown mode $mode"; exit 1 ;;
esac

curl -s -X DELETE "http://127.0.0.1:$sinkport/__items" > /dev/null

PORT=$port SINK="http://127.0.0.1:$sinkport/" SENTRY_DEBUG=1 bun "$entry" > "run-$mode.log" 2>&1 &
pid=$!
sleep 2
node ./drive.mjs "$port" "$sinkport" > "drive-$mode.log" 2>&1 || true
kill $pid
wait $pid 2>/dev/null || true
cat "drive-$mode.log"
