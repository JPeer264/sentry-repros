#!/bin/bash
# $1 = app port, $2 = sink port, $3 = label
P=$1; SINK=$2
curl -s -o /dev/null "http://127.0.0.1:$P/db"
curl -s -o /dev/null "http://127.0.0.1:$P/users/42"
curl -s -o /dev/null -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1111111111111111-1" -H "baggage: sentry-environment=incoming,sentry-public_key=public,sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" "http://127.0.0.1:$P/users/99"
curl -s -o /dev/null "http://127.0.0.1:$P/iso/a" &
curl -s -o /dev/null "http://127.0.0.1:$P/iso/b" &
curl -s -o /dev/null "http://127.0.0.1:$P/iso/c" &
wait
curl -s -o /dev/null "http://127.0.0.1:$P/sentinel"
for i in $(seq 1 40); do
  if curl -s "http://127.0.0.1:$SINK/__items" | grep -q '"sentinel"'; then break; fi
  sleep 0.5
done
