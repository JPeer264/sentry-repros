#!/bin/bash
# run.sh <main-hook|main-nohook> <app port> <sink port> <label> [deno binary]
# Starts the sink and the Deno app, drives /users, /users-conn and /sentinel,
# waits for the sentinel event, dumps the sink items and kills both processes.
set -u
ENTRY=$1; APP_PORT=$2; SINK_PORT=$3; LABEL=$4; DENO=${5:-deno}
cd "$(dirname "$0")"

PORT=$SINK_PORT node sink.mjs > "sink-$LABEL.log" 2>&1 &
spid=$!
sleep 1

APP_PORT=$APP_PORT SINK_PORT=$SINK_PORT "$DENO" run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$ENTRY.ts" > "app-$LABEL.log" 2>&1 &
apid=$!

up=0
for i in $(seq 1 40); do
  if curl -s -o /dev/null "http://127.0.0.1:$APP_PORT/__ready"; then up=1; break; fi
  sleep 0.5
done

if [ "$up" = "1" ]; then
  echo "--- /users";      curl -s "http://127.0.0.1:$APP_PORT/users"
  echo "--- /users-conn"; curl -s "http://127.0.0.1:$APP_PORT/users-conn"
  echo "--- /sentinel";   curl -s "http://127.0.0.1:$APP_PORT/sentinel"
  # Wait for the sentinel event, then for the streamed span envelopes it rode along with.
  for i in $(seq 1 40); do
    curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q '"sentinel"' && break
    sleep 0.5
  done
  for i in $(seq 1 60); do
    n=$(curl -s "http://127.0.0.1:$SINK_PORT/__items" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).filter(i=>i.type==="span").length))')
    [ "$n" -ge 3 ] && break
    sleep 0.5
  done
else
  echo "--- app never listened on $APP_PORT"
fi

curl -s "http://127.0.0.1:$SINK_PORT/__items" > "items-$LABEL.json"
echo "--- app log"; cat "app-$LABEL.log"
echo "--- sink items"; node -e 'for (const i of require("./items-'"$LABEL"'.json")) console.log(JSON.stringify(i))'

kill $apid 2>/dev/null; wait $apid 2>/dev/null
kill $spid 2>/dev/null; wait $spid 2>/dev/null
