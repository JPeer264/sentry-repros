#!/bin/zsh
P=$1; SINK=$2; shift 2
/usr/bin/curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
for u in "$@"; do /usr/bin/curl -s "http://127.0.0.1:$P$u" > /dev/null; done
sleep 1
python3 show.py $SINK
