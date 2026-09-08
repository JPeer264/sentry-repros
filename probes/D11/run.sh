#!/bin/sh
# Usage: ./run.sh <sink-port> [path-to-deno]
# Runs the three legs of D11 against a sink that must already be listening on <sink-port>.
set -u
PORT="$1"
DENO="${2:-deno}"

echo "== descriptor probe =="
"$DENO" run --unstable-cron --no-prompt desc-probe.ts
echo "exit=$?"

echo "== cron.ts with --unstable-cron (70 s, waits for the minute boundary) =="
curl -s -X DELETE "http://127.0.0.1:$PORT/__items" > /dev/null
SINK_PORT="$PORT" RUN_MS=70000 "$DENO" run --unstable-cron --no-prompt --allow-net --allow-env --allow-read --allow-sys cron.ts
echo "exit=$?"
echo "== sink =="
curl -s "http://127.0.0.1:$PORT/__items"
echo

echo "== cron.ts without --unstable-cron (3 s) =="
curl -s -X DELETE "http://127.0.0.1:$PORT/__items" > /dev/null
SINK_PORT="$PORT" RUN_MS=3000 "$DENO" run --no-prompt --allow-net --allow-env --allow-read --allow-sys cron.ts
echo "exit=$?"
echo "== sink =="
curl -s "http://127.0.0.1:$PORT/__items"
echo
