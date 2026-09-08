#!/bin/bash
set -u
D="$(cd "$(dirname "$0")" && pwd)"
cd "$D"
SINK_PORT=52117
REC_PORT=52118
export SINK_PORT REC_PORT

PORT=$SINK_PORT node sink.mjs > run-b-sink.log 2>&1 &
sinkpid=$!
PORT=$REC_PORT node recorder.mjs > run-b-rec.log 2>&1 &
recpid=$!
sleep 1

variant=$1
lifecycle=$2
app_port=$3
tag="$variant-$lifecycle"

curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null

VARIANT=$variant TRACE_LIFECYCLE=$lifecycle APP_PORT=$app_port SINK_PORT=$SINK_PORT REC_PORT=$REC_PORT \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys app.ts > "run-b-app-$tag.log" 2>&1 &
apppid=$!

for i in $(seq 1 60); do
  if grep -q "^PORT=" "run-b-app-$tag.log" 2>/dev/null; then break; fi
  sleep 0.5
done

echo "### app log ($tag)"
cat "run-b-app-$tag.log"

echo "### GET /downstream"
curl -s --max-time 10 "http://127.0.0.1:$app_port/downstream"; echo
echo "### GET /downstream-http"
curl -s --max-time 10 "http://127.0.0.1:$app_port/downstream-http"; echo
echo "### GET /sentinel"
curl -s --max-time 10 "http://127.0.0.1:$app_port/sentinel"; echo

for i in $(seq 1 40); do
  if curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q sentinel; then break; fi
  sleep 0.5
done
sleep 1

echo "### sink items"
curl -s "http://127.0.0.1:$SINK_PORT/__items" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const it of JSON.parse(d))console.log(JSON.stringify(it))})"
echo "### recorder seen"
curl -s "http://127.0.0.1:$REC_PORT/__seen" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const it of JSON.parse(d))console.log(JSON.stringify(it))})"

kill $apppid; wait $apppid 2>/dev/null
kill $sinkpid; wait $sinkpid 2>/dev/null
kill $recpid; wait $recpid 2>/dev/null
echo "### done $tag"
