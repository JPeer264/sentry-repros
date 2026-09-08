#!/bin/bash
# usage: drive.sh <appport> <sinkport> <label>
AP=$1; SP=$2
curl -s -X DELETE http://127.0.0.1:$SP/__items > /dev/null
curl -s -o /dev/null http://127.0.0.1:$AP/users/7
curl -s -o /dev/null http://127.0.0.1:$AP/error
curl -s -o /dev/null -X POST http://127.0.0.1:$AP/users/7/notes/9
curl -s -o /dev/null http://127.0.0.1:$AP/nope
curl -s -o /dev/null http://127.0.0.1:$AP/sentinel
for i in $(seq 1 60); do
  if curl -s http://127.0.0.1:$SP/__items | grep -q '"sentinel"'; then break; fi
  sleep 0.5
done
sleep 1
