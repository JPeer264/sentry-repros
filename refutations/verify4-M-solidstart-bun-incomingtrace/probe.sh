#!/bin/bash
# usage: probe.sh <label> <runtime-cmd...> ; env: APP_PORT SINK_PORT OUTDIR
set -u
LABEL=$1; shift
D=$REPRO/refutations/verify4-M-solidstart-bun-incomingtrace
SINK=${SINK_PORT:-47311}
APP=${APP_PORT:-47312}
TRACE=12345678901234567890123456789012
BAG="sentry-trace_id=$TRACE,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true,sentry-transaction=upstream"

curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null

cd $D/app
PORT=$APP HOST=127.0.0.1 SENTRY_TUNNEL="http://127.0.0.1:$SINK/" "$@" > $D/log-$LABEL.txt 2>&1 &
pid=$!
for i in $(seq 1 80); do
  sleep 0.5
  if curl -s -o /dev/null http://127.0.0.1:$APP/api/hello 2>/dev/null; then break; fi
done
echo "--- hello (with incoming trace)"
curl -s -H "sentry-trace: $TRACE-1234567890abcdef-1" -H "baggage: $BAG" http://127.0.0.1:$APP/api/hello
echo
echo "--- hello (no headers)"
curl -s http://127.0.0.1:$APP/api/hello
echo
curl -s http://127.0.0.1:$APP/api/sentinel > /dev/null
for i in $(seq 1 40); do
  sleep 0.5
  if curl -s http://127.0.0.1:$SINK/__items | grep -q sentinel; then break; fi
done
echo "--- sink items"
curl -s http://127.0.0.1:$SINK/__items | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const it of JSON.parse(s))console.log(JSON.stringify(it))})'
kill $pid 2>/dev/null; wait $pid 2>/dev/null
echo "--- server log"; tail -20 $D/log-$LABEL.txt
