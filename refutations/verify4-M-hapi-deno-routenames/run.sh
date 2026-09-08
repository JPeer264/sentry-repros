#!/bin/bash
# usage: run.sh <main.ts> <lifecycle> <tag> [extra deno args...]
set -u
S=$SCRATCH
D=$S/deep/verify4-M-hapi-deno-routenames
MAIN=$1; LIFE=$2; TAG=$3; shift 3
DENO=${DENO_BIN:-deno}
SINK_PORT=41731
APP_PORT=51837
curl -s -X DELETE http://127.0.0.1:$SINK_PORT/__items > /dev/null
cd $D
SINK_PORT=$SINK_PORT APP_PORT=$APP_PORT LIFECYCLE=$LIFE $DENO run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$@" $MAIN > $D/app-$TAG.log 2>&1 &
pid=$!
for i in $(seq 1 60); do
  if grep -q LISTENING $D/app-$TAG.log 2>/dev/null; then break; fi
  if ! kill -0 $pid 2>/dev/null; then echo "APP EXITED EARLY ($TAG)"; head -12 $D/app-$TAG.log; exit 1; fi
  sleep 0.5
done
if ! grep -q LISTENING $D/app-$TAG.log; then echo "NO LISTEN ($TAG)"; head -20 $D/app-$TAG.log; kill $pid 2>/dev/null; wait $pid 2>/dev/null; exit 1; fi
curl -s http://127.0.0.1:$APP_PORT/users/42 > /dev/null
curl -s http://127.0.0.1:$APP_PORT/error > /dev/null
curl -s http://127.0.0.1:$APP_PORT/db > /dev/null
curl -s http://127.0.0.1:$APP_PORT/sentinel > /dev/null
for i in $(seq 1 40); do
  if curl -s http://127.0.0.1:$SINK_PORT/__items | grep -q sentinel; then break; fi
  sleep 0.5
done
sleep 1
curl -s http://127.0.0.1:$SINK_PORT/__items > $D/items-$TAG.json
kill $pid 2>/dev/null; wait $pid 2>/dev/null
node -e '
const items = JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
for (const it of items) console.log(JSON.stringify(it));
' $D/items-$TAG.json
