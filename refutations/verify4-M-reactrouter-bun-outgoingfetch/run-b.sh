set -u
S=$SCRATCH
D=$REPRO/refutations/verify4-M-reactrouter-bun-outgoingfetch
SINK=51431; REC=51432; APP=51433
BUNBIN=${BUNBIN:-bun}
VARIANT=$1; LIFE=$2; TAG=$3

cd $D/app
SINK_PORT=$SINK PORT=$APP PROBE_VARIANT=$VARIANT PROBE_LIFECYCLE=$LIFE $BUNBIN server.js > $D/runb-$TAG.log 2>&1 &
APID=$!
for i in $(seq 1 60); do
  if grep -q "Server is running" $D/runb-$TAG.log 2>/dev/null; then break; fi
  command sleep 0.5
done
curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
echo "### $TAG variant=$VARIANT lifecycle=$LIFE" >> $D/recb.log
curl -s "http://127.0.0.1:$APP/fetchout?rec=$REC" -o /dev/null -w "fetchout http=%{http_code}\n"
curl -s "http://127.0.0.1:$APP/flush" -o /dev/null -w "flush http=%{http_code}\n"
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:$SINK/__items | grep -q sentinel; then break; fi
  command sleep 0.5
done
curl -s http://127.0.0.1:$SINK/__items > $D/items-$TAG.json
kill $APID; wait $APID 2>/dev/null
echo "--- items-$TAG"
cat $D/items-$TAG.json
