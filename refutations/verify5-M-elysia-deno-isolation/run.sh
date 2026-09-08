#!/bin/bash
# usage: run.sh <WIRING> <LIFECYCLE> <tag>
set -u
D="$(cd "$(dirname "$0")" && pwd)"
W=$1; L=$2; TAG=$3
SINKPORT=$((34000 + RANDOM % 2000))
APPPORT=$((36000 + RANDOM % 2000))
PORT=$SINKPORT node "$D/sink.mjs" > "$D/sink-$TAG.log" 2>&1 &
SPID=$!
sleep 1
WIRING=$W LIFECYCLE=$L APP_PORT=$APPPORT SINK_URL="http://127.0.0.1:$SINKPORT/" \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi "$D/app.ts" > "$D/app-$TAG.log" 2>&1 &
APID=$!
for i in $(seq 1 40); do grep -q "APP READY" "$D/app-$TAG.log" 2>/dev/null && break; sleep 0.5; done
if ! grep -q "APP READY" "$D/app-$TAG.log"; then echo "APP FAILED TO START"; cat "$D/app-$TAG.log"; kill $APID $SPID 2>/dev/null; exit 1; fi
curl -s "http://127.0.0.1:$APPPORT/tag/aaa" & C1=$!
curl -s "http://127.0.0.1:$APPPORT/tag/bbb" & C2=$!
curl -s "http://127.0.0.1:$APPPORT/tag/ccc" & C3=$!
wait $C1 $C2 $C3
sleep 1
curl -s "http://127.0.0.1:$APPPORT/sentinel" > /dev/null
for i in $(seq 1 40); do curl -s "http://127.0.0.1:$SINKPORT/__items" | grep -q '"sentinel"' && break; sleep 0.5; done
curl -s "http://127.0.0.1:$SINKPORT/__items" > "$D/items-$TAG.json"
kill $APID 2>/dev/null; wait $APID 2>/dev/null
kill $SPID 2>/dev/null; wait $SPID 2>/dev/null
echo "=== $TAG (wiring=$W lifecycle=$L) app-log tail ==="
tail -5 "$D/app-$TAG.log"
echo "=== items ==="
node -e '
const it=require("'"$D"'/items-'"$TAG"'.json");
for(const i of it){
 if(i.kind==="event") console.log(`event msg=${i.message} tags=${JSON.stringify(i.tags)} tx=${i.transaction} trace=${i.trace_id} sdk=${i.sdk} url=${i.url}`);
 else if(i.kind==="transaction") console.log(`transaction name=${i.name} op=${i.op} src=${i.source} tags=${JSON.stringify(i.tags)} trace=${i.trace_id} sdk=${i.sdk}`);
 else if(i.kind==="span") console.log(`span name=${i.name} op=${i.op} trace=${i.trace_id} seg=${i.seg} sdk=${i.sdk}`);
 else console.log(`${i.kind}`);
}'
