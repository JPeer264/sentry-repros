#!/bin/bash
# probe.sh <main-file> <lifecycle> <label>
# Starts the app, drives every route with curl, dumps sink items + recorder hits.
set -u
C="$(cd "$(dirname "$0")" && pwd)"
MAIN=$1; LIFECYCLE=$2; LABEL=$3
export SINK_PORT=43117 REC_PORT=43119

curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null

cd "$C"
LIFECYCLE=$LIFECYCLE deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys "$MAIN" > "app-$LABEL.log" 2>&1 &
APP=$!

for _ in $(seq 1 40); do
  grep -q 'READY PORT=' "app-$LABEL.log" 2>/dev/null && break
  kill -0 $APP 2>/dev/null || break
  sleep 0.5
done

if ! grep -q 'READY PORT=' "app-$LABEL.log" 2>/dev/null; then
  echo "APP DID NOT BOOT ($LABEL)"; cat "app-$LABEL.log"; kill $APP 2>/dev/null; wait $APP 2>/dev/null; exit 1
fi

P=$(grep -o 'READY PORT=[0-9]*' "app-$LABEL.log" | head -1 | cut -d= -f2)
echo "app on $P"

curl -s "http://127.0.0.1:$P/users/42" > /dev/null
curl -s -o /dev/null -w 'error http=%{http_code}\n' "http://127.0.0.1:$P/error"
curl -s "http://127.0.0.1:$P/db" > /dev/null
curl -s "http://127.0.0.1:$P/downstream" > /dev/null
curl -s "http://127.0.0.1:$P/downstream-http" > /dev/null
curl -s "http://127.0.0.1:$P/log" > /dev/null
curl -s -H 'sentry-trace: cccccccccccccccccccccccccccccccc-dddddddddddddddd-1' \
        -H 'baggage: sentry-trace_id=cccccccccccccccccccccccccccccccc,sentry-environment=probe' \
        "http://127.0.0.1:$P/users/9" > /dev/null
ISO=""
for t in alpha beta gamma; do curl -s "http://127.0.0.1:$P/iso/$t" > /dev/null & ISO="$ISO $!"; done
for pid in $ISO; do wait $pid; done
curl -s "http://127.0.0.1:$P/sentinel" > /dev/null

sleep 8
curl -s "http://127.0.0.1:$SINK_PORT/__items" > "items-$LABEL.json"
curl -s "http://127.0.0.1:$REC_PORT/__hits" > "hits-$LABEL.json"
kill $APP 2>/dev/null; wait $APP 2>/dev/null
echo "wrote items-$LABEL.json hits-$LABEL.json"
