#!/bin/bash
# usage: drive.sh <appport> <sinkport> <label>
APP=$1; SINK=$2; LABEL=$3
curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
echo "--- $LABEL mode=$(curl -s http://127.0.0.1:$APP/api/mode)"
for path in /api/boom /api/boom2 /throwpage; do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APP$path)
  echo "  $path -> $code"
done
curl -s -o /dev/null http://127.0.0.1:$APP/api/sentinel
for i in $(seq 1 40); do
  if curl -s http://127.0.0.1:$SINK/__items | grep -q '"sentinel"'; then break; fi
  sleep 0.5
done
curl -s http://127.0.0.1:$SINK/__items | python3 -c '
import json,sys
for it in json.load(sys.stdin):
    t=it.get("type")
    if t=="event":
        print("  event    |", it.get("message") or it.get("exception"), "| mech=", it.get("mechanism"), "handled=", it.get("handled"), "| ctxline=", it.get("hasContextLine"), "| tx=", it.get("transaction"), "| trace=", (it.get("trace_id") or "")[:8])
    elif t=="transaction":
        print("  tx       |", it.get("name"), "| src=", it.get("source"), "| status=", it.get("status"), "| trace=", (it.get("trace_id") or "")[:8])
    elif t=="span":
        print("  span     |", it.get("items"), "| trace=", (it.get("trace_id") or "")[:8])
    else:
        print("  ", t, it.get("items",""))
'
