#!/bin/bash
D=$REPRO/cells/M-solidstart-cf
cd $D
SINK=53817; REC=53819; APP=53825

node recorder.mjs > recorder.log 2>&1 &
recpid=$!
sleep 1

npx wrangler dev --config wrangler.jsonc --port $APP --inspector-port 0 > wrangler.log 2>&1 &
wpid=$!

for i in $(seq 1 90); do
  if grep -q "Ready on http://localhost:$APP" wrangler.log 2>/dev/null; then break; fi
  sleep 1
done
grep -m1 "Ready on" wrangler.log || { echo "NOT READY"; tail -40 wrangler.log; kill $wpid $recpid; exit 1; }

curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null

echo "== users =="; curl -s http://127.0.0.1:$APP/api/users/42; echo
echo "== boom ==";  curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:$APP/api/boom
echo "== trace =="; curl -s http://127.0.0.1:$APP/api/trace; echo
echo "== iso ==";   (curl -s "http://127.0.0.1:$APP/api/iso?who=alpha" & curl -s "http://127.0.0.1:$APP/api/iso?who=beta" & curl -s "http://127.0.0.1:$APP/api/iso?who=gamma" & wait); echo
echo "== fetchout =="; curl -s http://127.0.0.1:$APP/api/fetchout; echo
echo "== logme =="; curl -s http://127.0.0.1:$APP/api/logme; echo
echo "== incoming trace =="; curl -s -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1" -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1" http://127.0.0.1:$APP/api/trace; echo
echo "== db =="; curl -s -o db-response.txt -w "%{http_code}\n" http://127.0.0.1:$APP/api/db; head -c 400 db-response.txt; echo
echo "== sentinel =="; curl -s http://127.0.0.1:$APP/api/sentinel; echo

for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:$SINK/__items | grep -q '"sentinel"'; then echo "sentinel arrived after ${i}s"; break; fi
  sleep 1
done
sleep 8

curl -s http://127.0.0.1:$SINK/__items > observed-items.json
curl -s http://127.0.0.1:$REC/__seen > observed-recorder.json
echo "-- items --"; node -e "for(const i of require('$D/observed-items.json')) console.log(JSON.stringify(i))"
echo "-- recorder --"; cat observed-recorder.json; echo

kill $wpid; wait $wpid 2>/dev/null
kill $recpid; wait $recpid 2>/dev/null
echo "STOPPED"
