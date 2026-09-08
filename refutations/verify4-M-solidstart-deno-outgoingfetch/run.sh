#!/bin/bash
set -u
D="$(cd "$(dirname "$0")" && pwd)"
cd "$D"
SINK=51421; REC=51422; APP=51423
RUNTIME=$1   # node | deno
FIX=$2       # 0 | 1
LC=$3        # static | stream
TAG="$RUNTIME-fix$FIX-$LC"

PORT=$SINK node $REPRO/_toolbox/sink.mjs > "sink-$TAG.log" 2>&1 & sinkpid=$!
REC_PORT=$REC node recorder.mjs > "rec-$TAG.log" 2>&1 & recpid=$!
sleep 1
curl -s -X DELETE "http://127.0.0.1:$SINK/__items" > /dev/null

export PORT=$APP HOST=127.0.0.1 \
  SENTRY_TUNNEL="http://127.0.0.1:$SINK/" \
  SENTRY_LIFECYCLE=$LC \
  RECORDER_URL="http://127.0.0.1:$REC/recorder"
if [ "$FIX" = "1" ]; then export SENTRY_FETCH_FIX=1; else unset SENTRY_FETCH_FIX; fi

if [ "$RUNTIME" = "deno" ]; then
  deno run -A .output/server/index.mjs > "app-$TAG.log" 2>&1 & apppid=$!
else
  node .output/server/index.mjs > "app-$TAG.log" 2>&1 & apppid=$!
fi

for i in $(seq 1 60); do
  if grep -q "Listening on" "app-$TAG.log" 2>/dev/null; then break; fi
  sleep 0.5
done
echo "### app boot ($TAG)"; head -5 "app-$TAG.log"

echo "### GET /api/fetchout";      curl -s --max-time 10 "http://127.0.0.1:$APP/api/fetchout"; echo
echo "### GET /api/fetchout-http"; curl -s --max-time 10 "http://127.0.0.1:$APP/api/fetchout-http"; echo
echo "### GET /api/sentinel";      curl -s --max-time 10 "http://127.0.0.1:$APP/api/sentinel"; echo

for i in $(seq 1 40); do
  if curl -s "http://127.0.0.1:$SINK/__items" | grep -q sentinel; then break; fi
  sleep 0.5
done
sleep 1

echo "### sink items ($TAG)"
curl -s "http://127.0.0.1:$SINK/__items" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const it of JSON.parse(d))console.log(JSON.stringify(it))})"
echo "### recorder hits ($TAG)"
curl -s "http://127.0.0.1:$REC/__hits" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const it of JSON.parse(d))console.log(JSON.stringify(it))})"

kill $apppid; wait $apppid 2>/dev/null
kill $sinkpid; wait $sinkpid 2>/dev/null
kill $recpid; wait $recpid 2>/dev/null
echo "### done $TAG"
