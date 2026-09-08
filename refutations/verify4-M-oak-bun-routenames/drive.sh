#!/bin/zsh
P=$1
for u in /users/7 /ok /db /error; do
  printf "%s -> %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$P$u)"
done
curl -s -o /dev/null http://127.0.0.1:$P/sentinel
