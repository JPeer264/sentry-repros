#!/bin/bash
# usage: drive.sh <appport> <sinkport> <label>
P=$1; SK=$2; LBL=$3
curl -s -X DELETE http://127.0.0.1:$SK/__items > /dev/null
curl -s -o /dev/null -w "users:%{http_code} " http://127.0.0.1:$P/api/users/42
curl -s -o /dev/null -w "boom:%{http_code} " http://127.0.0.1:$P/api/boom
curl -s -w "child:%{http_code} " http://127.0.0.1:$P/api/child
curl -s -o /dev/null -w "sentinel:%{http_code}\n" http://127.0.0.1:$P/api/sentinel
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:$SK/__items | grep -q sentinel; then break; fi
  sleep 0.5
done
sleep 1
echo "=== $LBL ==="
curl -s http://127.0.0.1:$SK/__items | python3 "$(dirname "$0")/report.py"
