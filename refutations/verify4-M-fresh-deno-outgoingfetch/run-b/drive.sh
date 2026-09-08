#!/bin/bash
# $1 = label ; env: SENTRY_FETCH_TRACING, SENTRY_LIFECYCLE, MODE(dev|prod)
set -u
D=$REPRO/refutations/verify4-M-fresh-deno-outgoingfetch
LABEL=$1
SINK=58101; REC=58103; APP=58105
export SENTRY_TUNNEL="http://127.0.0.1:$SINK/"
export REC_URL="http://127.0.0.1:$REC"
export SENTRY_LIFECYCLE="${SENTRY_LIFECYCLE:-static}"
export SENTRY_FETCH_TRACING="${SENTRY_FETCH_TRACING:-0}"
curl -s -X DELETE http://127.0.0.1:$SINK/__items >/dev/null
curl -s -X DELETE http://127.0.0.1:$REC/__hits >/dev/null
cd $D/app
if [ "${MODE:-dev}" = "dev" ]; then
  deno task dev --port $APP > $D/run-b/$LABEL.server.log 2>&1 &
else
  deno serve -A --port $APP _fresh/server.js > $D/run-b/$LABEL.server.log 2>&1 &
fi
PID=$!
echo "server=$PID"
for i in $(seq 1 60); do
  curl -s -o /dev/null http://127.0.0.1:$APP/ && break
  sleep 1
done
curl -s http://127.0.0.1:$APP/api/out; echo
curl -s http://127.0.0.1:$APP/api/outnode; echo
curl -s http://127.0.0.1:$APP/api/sentinel; echo
sleep 3
echo "--- SINK ($LABEL)"
curl -s http://127.0.0.1:$SINK/__items | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const i of JSON.parse(s)){if(i.type==="transaction")console.log(`transaction | ${i.name} | op=${i.op} | src=${i.source} | spans=${JSON.stringify(i.spans)}`);else if(i.type==="span")console.log(`span | ${JSON.stringify(i.items)}`);else if(i.type==="event")console.log(`event | ${i.message}`);else console.log(i.type);}})'
echo "--- REC ($LABEL)"
curl -s http://127.0.0.1:$REC/__hits
echo
kill $PID 2>/dev/null; wait $PID 2>/dev/null
