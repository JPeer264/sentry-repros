#!/usr/bin/env bash
# Shared helpers. Source it: `. "$(dirname "$0")/lib.sh" <run> <on|off>`.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

run="${1:?usage: $0 <run-id> [on|off]}"
cache="${2:-on}"
[[ "$cache" == "on" || "$cache" == "off" ]] || { echo "cache must be 'on' or 'off'" >&2; exit 2; }

worker="repro-${run}-cache-${cache}"
environment="$worker"
window="runs/${worker}.window"
mkdir -p runs

worker_url() {
  : "${WORKERS_SUBDOMAIN:?set WORKERS_SUBDOMAIN (https://<worker>.<subdomain>.workers.dev)}"
  echo "https://${worker}.${WORKERS_SUBDOMAIN}.workers.dev"
}

# Three consecutive HTTP 200 /health responses: the route of a fresh worker needs a moment to propagate.
wait_healthy() {
  local base="$1" ok=0 code
  for _ in $(seq 1 20); do
    code=$(curl -s -m 10 -o /dev/null -w "%{http_code}" "${base}/health" || echo 000)
    if [[ "$code" == "200" ]]; then ok=$((ok + 1)); else ok=0; fi
    [[ $ok -ge 3 ]] && return 0
    sleep 3
  done
  echo "worker never reached three consecutive HTTP 200 health checks" >&2
  return 1
}

stamp() {
  echo "$1 $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$window"
}
