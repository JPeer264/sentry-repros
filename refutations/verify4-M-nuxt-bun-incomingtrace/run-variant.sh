#!/bin/zsh
set -u
D=$REPRO/refutations/verify4-M-nuxt-bun-incomingtrace
V=$1
O=$D/app/.output/server
TR='sentry-trace: 12345678901234567890123456789012-1234567890123456-1'
BG='baggage: sentry-trace_id=12345678901234567890123456789012,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true'
sed -i '' "1s|^import '.*';|import './sentry.variant$V.mjs';|" $O/index.mjs
curl -s -X DELETE http://127.0.0.1:41318/__items > /dev/null
cd $D/app && PORT=41417 bun run .output/server/index.mjs > $D/run-$V.log 2>&1 &
pid=$!
for i in $(seq 1 60); do grep -q "Listening on" $D/run-$V.log 2>/dev/null && break; /bin/sleep 0.5; done
echo "--- boot pid=$pid"
echo -n "users/42: "; curl -s -H "$TR" -H "$BG" http://127.0.0.1:41417/users/42; echo
echo -n "api/error: "; curl -s -H "$TR" -H "$BG" http://127.0.0.1:41417/api/error | head -c 120; echo
curl -s http://127.0.0.1:41417/api/sentinel > /dev/null
for i in $(seq 1 40); do curl -s http://127.0.0.1:41318/__items | grep -q sentinel && break; /bin/sleep 0.5; done
echo "--- traces (type / trace_id / parent / name)"
python3 $D/dump.py
kill $pid; wait $pid 2>/dev/null
echo "--- done $V"
