#!/bin/bash
set -u
D="$(cd "$(dirname "$0")" && pwd)"
cd "$D"

SINK_PORT=47411
REC_PORT=47412
APP_PORT=$3
variant=$1
lifecycle=$2
tag="$variant-$lifecycle"

PORT=$SINK_PORT node sink.mjs > "r-sink-$tag.log" 2>&1 &
sinkpid=$!
PORT=$REC_PORT node recorder.mjs > "r-rec-$tag.log" 2>&1 &
recpid=$!
sleep 1

SENTRY_VARIANT=$variant TRACE_LIFECYCLE=$lifecycle PORT=$APP_PORT SINK_PORT=$SINK_PORT \
  REC_URL="http://127.0.0.1:$REC_PORT" \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys server.mjs > "r-app-$tag.log" 2>&1 &
apppid=$!

for i in $(seq 1 80); do
  grep -q "^READY" "r-app-$tag.log" 2>/dev/null && break
  sleep 0.5
done
echo "### app boot ($tag)"; grep -v "^Sentry Logger" "r-app-$tag.log" | head -5

echo "### drive"
curl -s -o /dev/null -w "fetchout:%{http_code} " --max-time 20 "http://127.0.0.1:$APP_PORT/fetchout"
curl -s -o /dev/null -w "httpout:%{http_code} " --max-time 20 "http://127.0.0.1:$APP_PORT/httpout"
curl -s -o /dev/null -w "undicifetch:%{http_code} " --max-time 20 "http://127.0.0.1:$APP_PORT/undicifetch"
curl -s -o /dev/null -w "sentinel:%{http_code}\n" --max-time 20 "http://127.0.0.1:$APP_PORT/sentinel"

for i in $(seq 1 40); do
  curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q sentinel && break
  sleep 0.5
done
sleep 2

echo "### sink items ($tag)"
curl -s "http://127.0.0.1:$SINK_PORT/__items" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const it of JSON.parse(d))console.log(JSON.stringify(it))})"
echo "### recorder seen ($tag)"
curl -s "http://127.0.0.1:$REC_PORT/__seen" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const it of JSON.parse(d))console.log(JSON.stringify(it))})"

kill $apppid 2>/dev/null; wait $apppid 2>/dev/null
kill $sinkpid 2>/dev/null; wait $sinkpid 2>/dev/null
kill $recpid 2>/dev/null; wait $recpid 2>/dev/null
echo "### done $tag"
