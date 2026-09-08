#!/bin/bash
set -u
D="$(cd "$(dirname "$0")" && pwd)"
MODE=$1; LC=$2; LBL=$3
SINKP=51477; APPP=51478
cd "$D/app"
PROBE_MODE=$MODE PROBE_LIFECYCLE=$LC PROBE_SINK="http://127.0.0.1:$SINKP/" \
  deno task dev --port $APPP --strictPort > "$D/out-$LBL.serverlog" 2>&1 &
pid=$!
for i in $(seq 1 90); do
  if curl -s -o /dev/null http://127.0.0.1:$APPP/ 2>/dev/null; then break; fi
  sleep 1
done
{ echo "=== $LBL (mode=$MODE lifecycle=$LC, vite dev)"; "$D/drive2.sh" $APPP $SINKP; } > "$D/out-$LBL.txt" 2>&1
kill $pid 2>/dev/null
wait $pid 2>/dev/null
