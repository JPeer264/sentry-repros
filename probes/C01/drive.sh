#!/usr/bin/env bash
# usage: drive.sh <app-port> <sink-port>
set -u
APP=$1
SINK=$2
curl -s -X DELETE "http://127.0.0.1:$SINK/__items" > /dev/null
echo "=== GET /enriched-throw?q=1 ==="
curl -s -i -H 'x-c01-header: c01-value' -H 'cookie: c01=1' "http://127.0.0.1:$APP/enriched-throw?q=1" | head -20
echo "=== GET /waituntil-throw ==="
curl -s -i "http://127.0.0.1:$APP/waituntil-throw" | head -5
echo "=== GET /waituntil-reject ==="
curl -s -i "http://127.0.0.1:$APP/waituntil-reject" | head -5
echo "=== GET /sentinel?n=1 ==="
curl -s -i "http://127.0.0.1:$APP/sentinel?n=1" | head -5
for i in $(seq 1 40); do
  out=$(curl -s "http://127.0.0.1:$SINK/__items")
  echo "$out" | grep -q 'sentinel 1' && { echo "=== sentinel arrived after ${i} polls ==="; break; }
  sleep 0.5
done
