#!/bin/bash
# B01 baseline runner (no SDK). Usage: ./run-baseline.sh [bun-binary]
set -u
cd "$(dirname "$0")/baseline"
BUN="${1:-bun}"
OUT="../results-baseline.log"
: > "$OUT"

run_case() {
  local name="$1"; shift
  echo "=== BASELINE $name ===" >> "$OUT"
  env "$@" >> "$OUT" 2>&1
  echo "EXIT_CODE=$?" >> "$OUT"
  echo >> "$OUT"
}

run_case "throw-timer"         "$BUN" throw.ts
run_case "throw-toplevel"      WHERE=toplevel "$BUN" throw.ts
run_case "reject-default"      "$BUN" reject.ts
run_case "userhandler-default" USER_HANDLER=1 "$BUN" throw.ts

cat "$OUT"
