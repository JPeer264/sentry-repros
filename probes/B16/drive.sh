#!/bin/sh
# usage: SINK_PORT=51841 PORT=51842 sh drive.sh
SINK_PORT=${SINK_PORT:-34117}
PORT=${PORT:-34118}

curl -s -X DELETE "http://127.0.0.1:$SINK_PORT/__items" > /dev/null
for r in sqlite sql redis sentinel; do
  echo "/$r -> $(curl -s "http://127.0.0.1:$PORT/$r")"
done

i=0
while [ $i -lt 60 ]; do
  if curl -s "http://127.0.0.1:$SINK_PORT/__items" | grep -q '"sentinel"'; then break; fi
  i=$((i + 1))
  sleep 1
done
sleep 7
curl -s "http://127.0.0.1:$SINK_PORT/__items"
echo
