#!/bin/bash
# Starts the sink, the fetch recorder and the built nitro node output under Deno,
# then drives the seven capability probes and prints the sink items.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
APP_PORT=${APP_PORT:-47311}
SINK_PORT=${SINK_PORT:-47313}
REC_PORT=${REC_PORT:-47315}
SUFFIX=${SUFFIX:-static}

PORT=$SINK_PORT node "$HERE/sink.mjs" > "$HERE/sink.log" 2>&1 &
SINK_PID=$!
PORT=$REC_PORT node "$HERE/recorder.mjs" > "$HERE/recorder.log" 2>&1 &
REC_PID=$!
sleep 1

cd "$HERE/.output/server"
PORT=$APP_PORT \
PROBE_DSN=https://public@dsn.ingest.sentry.io/1337 \
PROBE_TUNNEL=http://127.0.0.1:$SINK_PORT/ \
PROBE_RECORDER=http://127.0.0.1:$REC_PORT/rec \
PROBE_LIFECYCLE=${PROBE_LIFECYCLE:-static} \
PROBE_DEBUG=1 \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi deno-entry.mjs \
  > "$HERE/app-$SUFFIX.log" 2>&1 &
APP_PID=$!
cd "$HERE"

for i in $(seq 1 90); do
  curl -sf -o /dev/null "http://127.0.0.1:$APP_PORT/api/ping" && break
  sleep 0.5
done
echo "== ping: $(curl -s http://127.0.0.1:$APP_PORT/api/ping)"

curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null

echo "== errors: GET /api/error"
curl -s -o /dev/null -w "status=%{http_code}\n" "http://127.0.0.1:$APP_PORT/api/error"

echo "== route names: /api/user/42, /param/42, /users/123"
curl -s "http://127.0.0.1:$APP_PORT/api/user/42"; echo
curl -s -o /dev/null -w "param status=%{http_code}\n" "http://127.0.0.1:$APP_PORT/param/42"
curl -s -o /dev/null -w "users status=%{http_code}\n" "http://127.0.0.1:$APP_PORT/users/123"

echo "== isolation: concurrent /api/tag/{a,b,c}"
curl -s "http://127.0.0.1:$APP_PORT/api/tag/a" & A_PID=$!
curl -s "http://127.0.0.1:$APP_PORT/api/tag/b" & B_PID=$!
curl -s "http://127.0.0.1:$APP_PORT/api/tag/c" & C_PID=$!
wait $A_PID $B_PID $C_PID
echo

echo "== incoming trace: /api/error with sentry-trace"
curl -s -o /dev/null -w "status=%{http_code}\n" \
  -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1" \
  -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=qa,sentry-public_key=public,sentry-sample_rate=1" \
  "http://127.0.0.1:$APP_PORT/api/error"

echo "== outgoing fetch: /api/fetchout"
curl -s "http://127.0.0.1:$APP_PORT/api/fetchout"; echo
echo "RECORDER $(curl -s http://127.0.0.1:$REC_PORT/__seen)"

echo "== db spans: /api/db-mysql"
echo "DBRESP $(curl -s http://127.0.0.1:$APP_PORT/api/db-mysql)"

echo "== logs: /api/log"
curl -s "http://127.0.0.1:$APP_PORT/api/log"; echo

echo "== sentinel"
curl -s "http://127.0.0.1:$APP_PORT/api/sentinel"; echo
for i in $(seq 1 40); do
  curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q '"sentinel"' && break
  sleep 0.5
done
sleep 9   # log envelopes flush on a ~7s timer

curl -s "http://127.0.0.1:$SINK_PORT/__items" > "$HERE/items-$SUFFIX.json"
echo "== /__items"
python3 -c "import json;[print(json.dumps(i)) for i in json.load(open('$HERE/items-$SUFFIX.json'))]"

kill $APP_PID 2>/dev/null; wait $APP_PID 2>/dev/null
kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
kill $REC_PID 2>/dev/null; wait $REC_PID 2>/dev/null
echo "stopped"
