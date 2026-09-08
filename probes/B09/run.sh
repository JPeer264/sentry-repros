#!/bin/bash
# usage: ./run.sh <mode: permissive|nobodies> <app port> <sink port>
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:-permissive}"; PORT="${2:-41294}"; SINK_PORT="${3:-41293}"

PORT=$SINK_PORT node "$DIR/sink.mjs" > "$DIR/sink-$MODE.log" 2>&1 &
SINKPID=$!
sleep 1
curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null

MODE=$MODE SINK_PORT=$SINK_PORT PORT=$PORT bun "$DIR/app.ts" > "$DIR/app-$MODE.log" 2>&1 &
APPPID=$!
for _ in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:$PORT/nope" && break
  sleep 0.25
done

node "$DIR/probe.mjs" "$PORT" "$SINK_PORT" > "$DIR/items-$MODE.json" 2> "$DIR/drive-$MODE.log"

kill $APPPID; wait $APPPID 2>/dev/null
kill $SINKPID; wait $SINKPID 2>/dev/null
echo "--- $MODE: $DIR/items-$MODE.json"
