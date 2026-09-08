#!/bin/bash
# usage: run2.sh <entry> <lifecycle> <tag>
S=$SCRATCH
cd "$(dirname "$0")"
ENTRY=$1; LC=$2; TAG=$3
SINK=$((41000 + RANDOM % 4000)); PORT=$((45000 + RANDOM % 4000))
PORT=$SINK node $REPRO/_toolbox/sink.mjs > sink-$TAG.log 2>&1 &
SPID=$!
sleep 1
PORT=$PORT SINK=$SINK LIFECYCLE=$LC deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys $ENTRY > run2-$TAG.log 2>&1 &
DPID=$!
for i in $(seq 1 40); do curl -sf http://127.0.0.1:$PORT/sentinel >/dev/null 2>&1 && break; sleep 0.5; done
echo "--- curl /db"; curl -s -m 10 http://127.0.0.1:$PORT/db; echo
curl -s -m 10 http://127.0.0.1:$PORT/sentinel >/dev/null
for i in $(seq 1 40); do curl -s http://127.0.0.1:$SINK/__items | grep -q sentinel && break; sleep 0.5; done
sleep 2
echo "--- items"; curl -s http://127.0.0.1:$SINK/__items | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{for(const i of JSON.parse(d))console.log(JSON.stringify(i))})'
kill $DPID 2>/dev/null; kill $SPID 2>/dev/null; wait $DPID 2>/dev/null; wait $SPID 2>/dev/null
echo "--- app log"; head -c 1500 run2-$TAG.log
