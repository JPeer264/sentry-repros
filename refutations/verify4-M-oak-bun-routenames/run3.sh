#!/bin/zsh
set -e
D=$0:A:h
MODE=$1; LIFECYCLE=$2; PORT=$3; SINK=53197
curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
MODE=$MODE LIFECYCLE=$LIFECYCLE APP_PORT=$PORT SINK_PORT=$SINK bun $D/app.ts > $D/r3-$MODE-$LIFECYCLE.log 2>&1 &
pid=$!
for i in {1..60}; do grep -q "ready $PORT" $D/r3-$MODE-$LIFECYCLE.log 2>/dev/null && break; sleep 0.5; done
$D/drive.sh $PORT
for i in {1..60}; do curl -s http://127.0.0.1:$SINK/__items | grep -q sentinel && break; sleep 0.5; done
sleep 1
echo "=== MODE=$MODE LIFECYCLE=$LIFECYCLE"
curl -s "http://127.0.0.1:$SINK/__items?raw" | jq -r '.[] | select(.header.type=="span" or .header.type=="transaction") | .payload | if .items then (.items[] | "SPAN name=\(.name) op=\(.attributes["sentry.op"].value) status=\(.status) src=\(.attributes["sentry.segment.name.source"].value // "-") tmpl=\(.attributes["url.template"].value // "-")") else "TX name=\(.transaction) source=\(.transaction_info.source) status=\(.contexts.trace.status) tmpl=\(.contexts.trace.data["url.template"] // "-") spans=\([.spans[]|.op+" "+(.description//"")]|join(","))" end'
curl -s "http://127.0.0.1:$SINK/__items" | jq -c '.[] | select(.type=="event") | {exception,mechanism,handled,transaction}'
kill $pid; wait $pid 2>/dev/null || true
