#!/bin/bash
# B01 runner. Usage: ./run.sh [port] [bun-binary]
# Runs the six SDK cases against a fresh sink and writes results.log.
set -u
cd "$(dirname "$0")"
PORT="${1:-41801}"
BUN="${2:-bun}"
OUT="results.log"

PORT=$PORT node sink.mjs > sink.log 2>&1 &
spid=$!
sleep 1

: > "$OUT"

run_case() {
  local name="$1"; shift
  curl -s -X DELETE "http://127.0.0.1:$PORT/__items" > /dev/null
  echo "=== $name ===" >> "$OUT"
  env SINK_PORT="$PORT" "$@" >> "$OUT" 2>&1
  local code=$?
  echo "EXIT_CODE=$code" >> "$OUT"
  sleep 2
  curl -s "http://127.0.0.1:$PORT/__items" | python3 -c 'import json,sys
for i in json.load(sys.stdin): print(json.dumps(i))' >> "$OUT"
  echo >> "$OUT"
}

run_case "throw-timer"          "$BUN" throw.ts
run_case "throw-toplevel"       env WHERE=toplevel "$BUN" throw.ts
run_case "reject-default"       "$BUN" reject.ts
run_case "reject-strict"        env REJECTION_MODE=strict "$BUN" reject.ts
run_case "userhandler-default"  env USER_HANDLER=1 "$BUN" throw.ts
run_case "userhandler-exiteven" env USER_HANDLER=1 EXIT_EVEN=1 "$BUN" throw.ts

kill $spid; wait $spid 2>/dev/null
cat "$OUT"
