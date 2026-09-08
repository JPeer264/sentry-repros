#!/bin/bash
# usage: run.sh <mode> <lifecycle> <label>
set -u
D="$(cd "$(dirname "$0")" && pwd)"
MODE=$1; LC=$2; LBL=$3
SINKP=52911; APPP=52912
cd "$D/app"
PROBE_MODE=$MODE PROBE_LIFECYCLE=$LC PROBE_SINK="http://127.0.0.1:$SINKP/" \
  deno task dev --port $APPP --strictPort > "$D/$LBL.log" 2>&1 &
pid=$!
for i in $(seq 1 90); do
  if curl -s -o /dev/null http://127.0.0.1:$APPP/ 2>/dev/null; then break; fi
  sleep 1
done
"$D/drive.sh" $APPP $SINKP "$LBL"
kill $pid 2>/dev/null
wait $pid 2>/dev/null
