#!/bin/sh
# usage: ./run.sh <entry> <sink port> <label> [lifecycle]
set -e
entry=$1; sinkport=$2; label=$3; lifecycle=${4:-stream}
SINK_PORT=$sinkport LIFECYCLE=$lifecycle PORT=0 bun "$entry" > "app-$label.log" 2>&1 &
pid=$!
appport=""
i=0
while [ $i -lt 60 ]; do
  appport=$(sed -n 's/^PORT=//p' "app-$label.log" | head -1)
  [ -n "$appport" ] && break
  i=$((i+1))
  perl -e 'select(undef,undef,undef,0.5)'
done
if [ -z "$appport" ]; then echo "app did not start"; cat "app-$label.log"; kill $pid; exit 1; fi
node drive.mjs "$appport" "$sinkport" > "drive-$label.log" 2>&1 || true
kill $pid
wait $pid 2>/dev/null || true
echo "wrote drive-$label.log"
