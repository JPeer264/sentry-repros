#!/bin/bash
# Bun.build bundle with sentryBunPlugin: proves legacy mysql@2 spans and the stream lifecycle.
set -u
cd "$(dirname "$0")"
SINK=${SINK:-52117}
REC=${REC:-52182}
APP=${APP:-52181}
LC=${LIFECYCLE:-static}

PORT=$SINK node sink2.mjs > sink-b.log 2>&1 & sinkpid=$!
PORT=$REC node recorder.mjs > recorder-b.log 2>&1 & recpid=$!
sleep 1
PORT=$APP SINK_PORT=$SINK REC_PORT=$REC LIFECYCLE=$LC bun dist/app.js > app-b-$LC.log 2>&1 & apppid=$!
sleep 3

echo "users:  $(curl -s http://127.0.0.1:$APP/users/42)"
echo "boom:   $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APP/boom)"
echo "trace:  $(curl -s -H 'sentry-trace: cccccccccccccccccccccccccccccccc-dddddddddddddddd-1' -H 'baggage: sentry-trace_id=cccccccccccccccccccccccccccccccc,sentry-public_key=public,sentry-sample_rate=1' http://127.0.0.1:$APP/users/7)"
echo "fetch:  $(curl -s http://127.0.0.1:$APP/fetchout)"
echo "db:     $(curl -s http://127.0.0.1:$APP/db)"
echo "dbold:  $(curl -s http://127.0.0.1:$APP/dbold)"
echo "log:    $(curl -s http://127.0.0.1:$APP/log)"
echo "sent:   $(curl -s http://127.0.0.1:$APP/sentinel)"

for i in $(seq 1 30); do
  curl -s http://127.0.0.1:$SINK/__items | grep -q 'sentinel' && break
  sleep 1
done
sleep 8

curl -s http://127.0.0.1:$SINK/__items > items-bundled-$LC.json
curl -s http://127.0.0.1:$REC/__hits  > hits-bundled-$LC.json

kill $apppid; wait $apppid 2>/dev/null
kill $sinkpid; wait $sinkpid 2>/dev/null
kill $recpid; wait $recpid 2>/dev/null
echo "done"
