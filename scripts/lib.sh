#!/usr/bin/env bash
# Shared helpers. Source it: `. "$(dirname "$0")/lib.sh" <run> <on|off>`.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

run="${1:?usage: $0 <run-id> [on|off]}"
cache="${2:-on}"
[[ "$cache" == "on" || "$cache" == "off" ]] || { echo "cache must be 'on' or 'off'" >&2; exit 2; }

worker="repro-${run}-cache-${cache}"
environment="$worker"

worker_url() {
  : "${WORKERS_SUBDOMAIN:?set WORKERS_SUBDOMAIN (https://<worker>.<subdomain>.workers.dev)}"
  echo "https://${worker}.${WORKERS_SUBDOMAIN}.workers.dev"
}
