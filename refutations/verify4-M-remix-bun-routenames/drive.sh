#!/bin/zsh
# $1 = app port, $2 = sink port
P=$1; SP=$2
curl -s -o /dev/null "http://127.0.0.1:$P/users/42"
curl -s -o /dev/null "http://127.0.0.1:$P/posts/7/comments/9"
curl -s -o /dev/null "http://127.0.0.1:$P/boom/7"
curl -s -o /dev/null -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1111111111111111-1' -H 'baggage: sentry-environment=incoming,sentry-public_key=public,sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' "http://127.0.0.1:$P/users/99"
for i in a b c; do curl -s -o /dev/null "http://127.0.0.1:$P/iso/$i" & done
wait
sleep 1
curl -s -o /dev/null "http://127.0.0.1:$P/sentinel"
for i in $(seq 1 40); do
  n=$(curl -s "http://127.0.0.1:$SP/__items" | grep -c sentinel)
  if [ "$n" -gt 0 ]; then break; fi
  sleep 0.5
done
