#!/bin/bash
# usage: probe.sh <label> <runtime-cmd> <sinkport> <appport>
set -u
S=$SCRATCH
D=$REPRO/refutations/verify4-M-sveltekit-bun-outgoingfetch
LABEL=$1; RTCMD=$2; SP=$3; AP=$4
pause(){ perl -e 'select(undef,undef,undef,'"$1"')'; }

PORT=$SP node $D/sink.mjs > $D/sink-$LABEL.log 2>&1 &
SINK=$!
curl -s --retry 40 --retry-all-errors --retry-delay 1 --connect-timeout 1 "http://127.0.0.1:$SP/__items" > /dev/null

( cd $D/app && exec env PORT=$AP SENTRY_TUNNEL="http://127.0.0.1:$SP/" REC_URL="http://127.0.0.1:$SP" SENTRY_DEBUG=1 $RTCMD > $D/app-$LABEL.log 2>&1 ) &
APP=$!
curl -s --retry 60 --retry-all-errors --retry-delay 1 --connect-timeout 1 "http://127.0.0.1:$AP/api/hello" > /dev/null

echo "--- /api/out:"; curl -s "http://127.0.0.1:$AP/api/out"; echo
curl -s "http://127.0.0.1:$AP/api/hello" > /dev/null

for i in $(seq 1 60); do
  if curl -s "http://127.0.0.1:$SP/__items" | grep -q sentinel; then break; fi
  pause 0.5
done
pause 1.5
curl -s "http://127.0.0.1:$SP/__items" > $D/items-$LABEL.json
curl -s "http://127.0.0.1:$SP/__recs" > $D/rec-$LABEL.json
kill $APP 2>/dev/null; wait $APP 2>/dev/null
kill $SINK 2>/dev/null; wait $SINK 2>/dev/null
echo "=== items-$LABEL"; cat $D/items-$LABEL.json | python3 -m json.tool
echo "=== rec-$LABEL"; cat $D/rec-$LABEL.json
