#!/bin/bash
# usage: run-b11.sh <binary> <label> <cwd> <bunPort> <expressPort> <sinkPort>
set -u
BIN=$1; LABEL=$2; RUNCWD=$3; BUNPORT=$4; EXPRESSPORT=$5; SINKPORT=$6
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$RUNCWD" "$HERE/logs"

( cd "$RUNCWD" && SINK="http://127.0.0.1:$SINKPORT/" PORT=$BUNPORT EXPRESS_PORT=$EXPRESSPORT SENTRY_DEBUG=1 "$BIN" ) > "$HERE/logs/$LABEL.app.log" 2>&1 &
pid=$!

for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:$BUNPORT/injected"; then break; fi
  sleep 0.5
done

curl -s -X DELETE "http://127.0.0.1:$SINKPORT/__items" > /dev/null
node "$HERE/drive.mjs" "$BUNPORT" "$EXPRESSPORT" "$SINKPORT" > "$HERE/logs/$LABEL.drive.log" 2>&1

kill $pid 2>/dev/null
wait $pid 2>/dev/null
echo "done $LABEL"
