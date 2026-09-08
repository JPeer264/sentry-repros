#!/bin/zsh
P=$1; SINK=$2
curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
curl -s "http://127.0.0.1:$P/api/user?u=alice" > /dev/null
curl -s "http://127.0.0.1:$P/api/iso?t=first" > /dev/null
curl -s "http://127.0.0.1:$P/api/msg" > /dev/null
curl -s "http://127.0.0.1:$P/api/iso?t=second" > /dev/null
curl -s "http://127.0.0.1:$P/api/sentinel?n=1" > /dev/null
sleep 1
curl -s "http://127.0.0.1:$SINK/__items" | python3 -c '
import json,sys
for i in json.load(sys.stdin):
  t=i["type"]
  if t=="transaction": print("tx    |",i["name"],"| src=",i.get("source"),"| tags=",i.get("tags"),"| trace=",i.get("trace_id"))
  elif t=="event": print("event |",i.get("message"),"| user=",i.get("user"),"| ctx=",i.get("probeCtx"),"| tags=",i.get("tags"),"| crumbs=",len(i.get("breadcrumbs") or []))
  elif t=="span": print("span  |",i.get("items"))
'
