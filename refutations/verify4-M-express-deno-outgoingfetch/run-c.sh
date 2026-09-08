#!/bin/bash
set -u
D="$(cd "$(dirname "$0")" && pwd)"; cd "$D"
entry=$1; lifecycle=$2; SINK_PORT=$3; REC_PORT=$4; APP_PORT=$5; tag=$6
for p in $SINK_PORT $REC_PORT $APP_PORT; do
  if lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then echo "PORT $p BUSY - abort"; exit 1; fi
done
PORT=$SINK_PORT node sink.mjs > "run-c-sink-$tag.log" 2>&1 & sinkpid=$!
PORT=$REC_PORT node recorder.mjs > "run-c-rec-$tag.log" 2>&1 & recpid=$!
sleep 1
head -1 "run-c-sink-$tag.log"; head -1 "run-c-rec-$tag.log"
curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null
TRACE_LIFECYCLE=$lifecycle APP_PORT=$APP_PORT SINK_PORT=$SINK_PORT REC_PORT=$REC_PORT VARIANT=${VARIANT:-fetchint} \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$entry" > "run-c-app-$tag.log" 2>&1 & apppid=$!
for i in $(seq 1 60); do grep -q "^PORT=" "run-c-app-$tag.log" && break; sleep 0.5; done
cat "run-c-app-$tag.log"
echo "### GET /downstream"; curl -s --max-time 10 "http://127.0.0.1:$APP_PORT/downstream"; echo
echo "### GET /sentinel";   curl -s --max-time 10 "http://127.0.0.1:$APP_PORT/sentinel"; echo
for i in $(seq 1 40); do curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q sentinel && break; sleep 0.5; done
sleep 1
echo "### sink items"; curl -s "http://127.0.0.1:$SINK_PORT/__items" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const it of JSON.parse(d))console.log(JSON.stringify(it))})"
echo "### recorder seen"; curl -s "http://127.0.0.1:$REC_PORT/__seen" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const it of JSON.parse(d))console.log(JSON.stringify(it))})"
kill $apppid 2>/dev/null; wait $apppid 2>/dev/null
kill $sinkpid 2>/dev/null; wait $sinkpid 2>/dev/null
kill $recpid 2>/dev/null;  wait $recpid 2>/dev/null
echo "### done $tag"
