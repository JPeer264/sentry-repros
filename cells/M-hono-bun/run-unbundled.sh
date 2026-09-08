#!/bin/bash
# One honest unbundled run: sink + recorder + `bun app.ts`, drive every route, dump the sink.
set -u
cd "$(dirname "$0")"
SINK=${SINK:-52117}
REC=${REC:-52182}
APP=${APP:-52180}
LC=${LIFECYCLE:-static}

PORT=$SINK node sink2.mjs > sink.log 2>&1 & sinkpid=$!
PORT=$REC node recorder.mjs > recorder.log 2>&1 & recpid=$!
sleep 1
PORT=$APP SINK_PORT=$SINK REC_PORT=$REC LIFECYCLE=$LC bun app.ts > app.log 2>&1 & apppid=$!
sleep 3

echo "users:  $(curl -s http://127.0.0.1:$APP/users/42)"
echo "boom:   $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APP/boom)"
curl -s http://127.0.0.1:$APP/iso/aaa > /dev/null & i1=$!
curl -s http://127.0.0.1:$APP/iso/bbb > /dev/null & i2=$!
curl -s http://127.0.0.1:$APP/iso/ccc > /dev/null & i3=$!
wait $i1 $i2 $i3
echo "trace:  $(curl -s -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-public_key=public,sentry-sample_rate=1' http://127.0.0.1:$APP/users/7)"
echo "fetch:  $(curl -s http://127.0.0.1:$APP/fetchout)"
echo "db:     $(curl -s http://127.0.0.1:$APP/db)"
echo "dbold:  $(curl -s http://127.0.0.1:$APP/dbold)"
echo "log:    $(curl -s http://127.0.0.1:$APP/log)"
echo "sent:   $(curl -s http://127.0.0.1:$APP/sentinel)"

for i in $(seq 1 30); do
  curl -s http://127.0.0.1:$SINK/__items | grep -q '"sentinel"' && break
  sleep 1
done
sleep 8   # log envelopes flush on a timer

curl -s http://127.0.0.1:$SINK/__items > items-$LC.json
curl -s http://127.0.0.1:$REC/__hits  > hits-$LC.json

kill $apppid; wait $apppid 2>/dev/null
kill $sinkpid; wait $sinkpid 2>/dev/null
kill $recpid; wait $recpid 2>/dev/null
echo "done"
