#!/bin/bash
# Runs the app on bun and drives all seven capability probes.
set -u
APP_PORT=${APP_PORT:-45217}
SINK_PORT=${SINK_PORT:-45219}
LIFECYCLE=${PROBE_LIFECYCLE:-static}
SUFFIX=${SUFFIX:-$LIFECYCLE}

PORT=$APP_PORT \
PROBE_DSN=https://public@dsn.ingest.sentry.io/1337 \
PROBE_TUNNEL=http://127.0.0.1:$SINK_PORT/ \
PROBE_RECORDER=http://127.0.0.1:$SINK_PORT/__recorder \
PROBE_LIFECYCLE=$LIFECYCLE \
PROBE_DEBUG=1 \
  bun --preload ./instrument.server.mjs .output/server/index.mjs > app-$SUFFIX.log 2>&1 &
APP_PID=$!

for i in $(seq 1 60); do
  curl -sf -o /dev/null "http://127.0.0.1:$APP_PORT/api/ping" && break
  sleep 0.5
done

echo "== baseline ping =="
curl -s "http://127.0.0.1:$APP_PORT/api/ping"; echo

curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null
curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__recorded" > /dev/null

echo "== errors: GET /api/error =="
curl -s -o /dev/null -w "status=%{http_code}\n" "http://127.0.0.1:$APP_PORT/api/error"

echo "== route names: GET /api/user/123 and GET / =="
curl -s "http://127.0.0.1:$APP_PORT/api/user/123"; echo
curl -s -o /dev/null -w "ssr status=%{http_code}\n" "http://127.0.0.1:$APP_PORT/"

echo "== isolation: three concurrent GET /api/tag =="
curl -s "http://127.0.0.1:$APP_PORT/api/tag?tag=alpha" & TA=$!
curl -s "http://127.0.0.1:$APP_PORT/api/tag?tag=beta" & TB=$!
curl -s "http://127.0.0.1:$APP_PORT/api/tag?tag=gamma" & TC=$!
wait $TA $TB $TC
echo

echo "== incoming trace: GET /api/error with sentry-trace =="
curl -s -o /dev/null -w "status=%{http_code}\n" \
  -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1" \
  -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1" \
  "http://127.0.0.1:$APP_PORT/api/error"

echo "== outgoing fetch: GET /api/fetch =="
curl -s "http://127.0.0.1:$APP_PORT/api/fetch"; echo
echo "recorded: $(curl -s "http://127.0.0.1:$SINK_PORT/__recorded")"

echo "== db spans: GET /api/db-mysql =="
curl -s "http://127.0.0.1:$APP_PORT/api/db-mysql"; echo

echo "== logs: GET /api/log =="
curl -s "http://127.0.0.1:$APP_PORT/api/log"; echo

echo "== sentinel =="
curl -s "http://127.0.0.1:$APP_PORT/api/sentinel"; echo
for i in $(seq 1 40); do
  curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q '"sentinel"' && break
  sleep 0.5
done
sleep 9   # log envelopes flush on a ~7s timer

curl -s "http://127.0.0.1:$SINK_PORT/__items" > items-$SUFFIX.json
curl -s "http://127.0.0.1:$SINK_PORT/__recorded" > recorded-$SUFFIX.json
echo "== /__items =="
python3 -c "import json;[print(json.dumps(i)) for i in json.load(open('items-$SUFFIX.json'))]"

kill $APP_PID 2>/dev/null
sleep 3
kill -9 $APP_PID 2>/dev/null
echo "app stopped"
