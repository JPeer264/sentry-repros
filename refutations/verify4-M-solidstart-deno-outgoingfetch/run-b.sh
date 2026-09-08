#!/bin/bash
set -u
D="$(cd "$(dirname "$0")" && pwd)"
cd "$D"
SINK=52141; REC=52142; APP=52143
RUNTIME=$1   # node | deno
FIX=$2       # 0 | 1 | 2
LC=$3        # static | stream
TAG="rb-$RUNTIME-fix$FIX-$LC-${SENTRY_INIT_MODE:-plugin}"

PORT=$SINK node $REPRO/_toolbox/sink.mjs > "$TAG-sink.log" 2>&1 & sinkpid=$!
REC_PORT=$REC node recorder-b.mjs > "$TAG-rec.log" 2>&1 & recpid=$!
sleep 1
curl -s -X DELETE "http://127.0.0.1:$SINK/__items" > /dev/null

export PORT=$APP HOST=127.0.0.1 \
  SENTRY_TUNNEL="http://127.0.0.1:$SINK/" \
  SENTRY_LIFECYCLE=$LC \
  SENTRY_FETCH_FIX=$FIX \
  SENTRY_INIT_MODE=${SENTRY_INIT_MODE:-plugin} \
  RECORDER_URL="http://127.0.0.1:$REC/recorder"

if [ "$RUNTIME" = "deno" ]; then
  deno run -A .output/server/index.mjs > "$TAG-app.log" 2>&1 & apppid=$!
else
  node .output/server/index.mjs > "$TAG-app.log" 2>&1 & apppid=$!
fi

for i in $(seq 1 60); do
  if grep -q "Listening on" "$TAG-app.log" 2>/dev/null; then break; fi
  sleep 0.5
done
echo "### app boot ($TAG)"; head -5 "$TAG-app.log"

echo "### GET /api/fetchout";      curl -s --max-time 15 "http://127.0.0.1:$APP/api/fetchout"; echo
echo "### GET /api/fetchout-http"; curl -s --max-time 15 "http://127.0.0.1:$APP/api/fetchout-http"; echo
echo "### GET /api/sentinel";      curl -s --max-time 15 "http://127.0.0.1:$APP/api/sentinel"; echo

for i in $(seq 1 40); do
  if curl -s "http://127.0.0.1:$SINK/__items" | grep -q sentinel; then break; fi
  sleep 0.5
done
sleep 1

echo "### sink items ($TAG)"
curl -s "http://127.0.0.1:$SINK/__items" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const it of JSON.parse(d))console.log(JSON.stringify(it))})"
echo "### recorder hits ($TAG)"
curl -s "http://127.0.0.1:$REC/__hits" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const it of JSON.parse(d))console.log(JSON.stringify(it))})"

kill $apppid 2>/dev/null; sleep 2; kill -9 $apppid 2>/dev/null
kill $sinkpid 2>/dev/null; kill -9 $sinkpid 2>/dev/null
kill $recpid 2>/dev/null; kill -9 $recpid 2>/dev/null
sleep 1
echo "### done $TAG"
