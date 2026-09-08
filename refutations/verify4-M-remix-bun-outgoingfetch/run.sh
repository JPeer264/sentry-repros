#!/bin/zsh
# usage: run.sh <label> <variant> <lifecycle> [runtime-cmd...]
set -u
D=${0:A:h}
LABEL=$1; VARIANT=$2; LIFECYCLE=$3; shift 3
RUNCMD=${@:-"bun server.mjs"}
SINK=41231; REC=41232; APP=41233

curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
cd $D/app
SINK_PORT=$SINK PORT=$APP PROBE_VARIANT=$VARIANT PROBE_LIFECYCLE=$LIFECYCLE NODE_ENV=production \
  ${=RUNCMD} > $D/app-$LABEL.log 2>&1 &
APID=$!
for i in {1..60}; do
  curl -s -o /dev/null http://127.0.0.1:$APP/ && break
  sleep 0.5
done
curl -s -o /dev/null "http://127.0.0.1:$APP/outfetch?rec=$REC"
curl -s -o /dev/null "http://127.0.0.1:$APP/iso/a" & C1=$!
curl -s -o /dev/null "http://127.0.0.1:$APP/iso/b" & C2=$!
curl -s -o /dev/null "http://127.0.0.1:$APP/iso/c" & C3=$!
wait $C1 $C2 $C3
curl -s -o /dev/null "http://127.0.0.1:$APP/users/42"
curl -s -o /dev/null "http://127.0.0.1:$APP/sentinel"
for i in {1..40}; do
  curl -s http://127.0.0.1:$SINK/__items | grep -q sentinel && break
  sleep 0.5
done
sleep 1
curl -s http://127.0.0.1:$SINK/__items > $D/items-$LABEL.json
curl -s http://127.0.0.1:$REC/__recorded > $D/rec-$LABEL.json; curl -s -X DELETE http://127.0.0.1:$REC/__recorded > /dev/null
kill $APID 2>/dev/null; wait $APID 2>/dev/null
echo "=== $LABEL items ==="
node -e 'const a=require(process.argv[1]);a.forEach(i=>console.log(JSON.stringify(i)))' $D/items-$LABEL.json
echo "=== $LABEL recorder ==="
cat $D/rec-$LABEL.json; echo
