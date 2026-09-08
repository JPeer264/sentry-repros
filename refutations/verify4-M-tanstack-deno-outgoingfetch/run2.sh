#!/bin/bash
# usage: run2.sh <label> <runtime: node|deno> <entryfile> <lifecycle>
set -u
D="$(cd "$(dirname "$0")" && pwd)"
LABEL=$1; RT=$2; ENTRY=$3; LC=$4
SINK=47311; REC=47313; APP=47315
export SINK_PORT=$SINK PROBE_LIFECYCLE=$LC PORT=$APP
export RECORDER_URL="http://127.0.0.1:$REC/rec-$LABEL"
curl -s -X DELETE "http://127.0.0.1:$SINK/__items" > /dev/null
cd "$D/.output/server"
if [ "$RT" = node ]; then
  node --import "./$ENTRY" ./index.mjs > "$D/run2-app-$LABEL.log" 2>&1 &
else
  cat > "$D/.output/server/deno-entry-$LABEL.mjs" <<EOF
import './$ENTRY';
import './index.mjs';
EOF
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi "./deno-entry-$LABEL.mjs" > "$D/run2-app-$LABEL.log" 2>&1 &
fi
pid=$!
for i in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:$APP/api/sentinel" && break
  sleep 0.5
done
sleep 1
echo "--- fetchout response:"
curl -s "http://127.0.0.1:$APP/api/fetchout"; echo
curl -s -o /dev/null "http://127.0.0.1:$APP/api/sentinel"
for i in $(seq 1 40); do
  if curl -s "http://127.0.0.1:$SINK/__items" | grep -q sentinel; then break; fi
  sleep 0.5
done
sleep 1
echo "--- sink items ($LABEL, $RT, $LC):"
curl -s "http://127.0.0.1:$SINK/__items" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const i of JSON.parse(s))console.log(JSON.stringify(i))})'
echo "--- recorder seen:"
curl -s "http://127.0.0.1:$REC/__seen" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const i of JSON.parse(s))if(i.url.includes("'"$LABEL"'"))console.log(JSON.stringify(i))})'
kill $pid 2>/dev/null; wait $pid 2>/dev/null
echo "--- done $LABEL"
