#!/bin/zsh
# usage: drive.sh <appport> <sinkport>
P=$1; SINK=$2
curl -s "http://127.0.0.1:$P/api/iso?t=a" > /dev/null &
curl -s "http://127.0.0.1:$P/api/iso?t=b" > /dev/null &
curl -s "http://127.0.0.1:$P/api/iso?t=c" > /dev/null &
wait
echo "-- after concurrent iso, scopes:"; curl -s "http://127.0.0.1:$P/api/scopes"; echo
curl -s "http://127.0.0.1:$P/api/msg" > /dev/null
curl -s "http://127.0.0.1:$P/api/sentinel?n=1" > /dev/null
sleep 1
curl -s "http://127.0.0.1:$SINK/__items" | python3 -c '
import json,sys
for i in json.load(sys.stdin):
    t=i.get("type")
    if t=="transaction": print("transaction |",i.get("name"),"| src=",i.get("source"),"| trace=",i.get("trace_id"),"| tags=",i.get("tags"))
    elif t=="event": print("event |",i.get("message") or i.get("exception"),"| trace=",i.get("trace_id"),"| tx=",i.get("transaction"),"| tags=",i.get("tags"))
    elif t=="span": print("span |",i.get("items"),"| trace=",i.get("trace_id"))
    else: print(t)
'
