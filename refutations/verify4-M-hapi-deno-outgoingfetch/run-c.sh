#!/bin/bash
set -u
SINKP=41971; RECP=41972; APPP=41973
cd "$(dirname "$0")"
PORT=$SINKP node sink.mjs > c-sink.log 2>&1 & SINKPID=$!
REC_PORT=$RECP node recorder.mjs > c-rec.log 2>&1 & RECPID=$!
sleep 1
SINK_PORT=$SINKP REC_PORT=$RECP APP_PORT=$APPP LIFECYCLE=stream FETCHFIX=0 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-hook.ts > c-app.log 2>&1 & APPPID=$!
for i in $(seq 1 60); do curl -s -m 1 http://127.0.0.1:$APPP/sentinel >/dev/null 2>&1 && break; sleep 0.5; done
curl -s -m 5 http://127.0.0.1:$APPP/downstream > /dev/null
curl -s -m 5 http://127.0.0.1:$APPP/sentinel > /dev/null
for i in $(seq 1 40); do curl -s http://127.0.0.1:$SINKP/__items | grep -q sentinel && break; sleep 0.5; done
sleep 1
echo "### items E-baseline-hook-stream"
curl -s http://127.0.0.1:$SINKP/__items | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{for(const i of JSON.parse(d))console.log(JSON.stringify(i))})'
kill $APPPID 2>/dev/null; wait $APPPID 2>/dev/null
kill $SINKPID 2>/dev/null; wait $SINKPID 2>/dev/null
kill $RECPID 2>/dev/null; wait $RECPID 2>/dev/null
