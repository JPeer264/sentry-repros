#!/bin/bash
# Usage: run.sh <dir> <worker-name> <port> <label> [vite config]
# Builds one variant, boots it with wrangler dev, drives the routes and dumps
# the sink. The sink must already be listening on 53821.
set -u
DIR="$1"; WORKER="$2"; PORT="$3"; LABEL="$4"; CFG="${5:-vite.config.ts}"
SINK=53821
cd "$DIR" || exit 1

curl -s -X DELETE "http://127.0.0.1:$SINK/__items" > /dev/null

npx vite build --config "$CFG" > "out-$LABEL.build.log" 2>&1
echo "== build tail =="; tail -5 "out-$LABEL.build.log"

BUNDLE="dist/$WORKER/index.js"
echo "== bundle grep ($BUNDLE) =="
for pat in 'withSentry(' 'instrumentDurableObjectWithSentry' 'instrumentWorkflowWithSentry' 'rpcTracePropagationBindings' '__SENTRY_ORCHESTRION__'; do
  printf '  %-40s %s\n' "$pat" "$(grep -c -- "$pat" "$BUNDLE" 2>/dev/null; true)"
done
grep -o "const __SENTRY_OPTIONS__ = .*" "$BUNDLE" 2>/dev/null | head -1
grep -oE "^const [A-Za-z_]+ = (withSentry|instrument[A-Za-z]+WithSentry)\(__SENTRY_OPTIONS__, [A-Za-z_]+\);" "$BUNDLE" 2>/dev/null

npx wrangler dev --config "dist/$WORKER/wrangler.json" --port "$PORT" --inspector-port 0 > "out-$LABEL.app.log" 2>&1 &
apid=$!
for i in $(seq 1 90); do grep -q "Ready on http://localhost:$PORT" "out-$LABEL.app.log" && break; sleep 1; done

echo "== routes =="
# /db first: a module-scope mysql socket in workerd only survives one request.
for route in /db /do /rpc /injected /error /sentinel; do
  printf '  %-10s %s\n' "$route" "$(curl -s --max-time 20 "http://127.0.0.1:$PORT$route" | head -c 300)"
done
sleep 3
curl -s "http://127.0.0.1:$SINK/__items" > "out-$LABEL.sink.json"
echo "== sink =="
python3 -c "import json,sys;[print(' ',json.dumps(x)) for x in json.load(open('out-$LABEL.sink.json'))]"

kill $apid 2>/dev/null; wait $apid 2>/dev/null
