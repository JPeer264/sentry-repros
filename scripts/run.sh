#!/usr/bin/env bash
# Everything for one run: deploy a fresh worker, send the load, validate in Sentry, read the CPU cost.
#
# usage: scripts/run.sh <run-id> [on|off]
# env:   SENTRY_DSN, WORKERS_SUBDOMAIN, SENTRY_TARGET (<org>/<project>), CLOUDFLARE_ACCOUNT_ID
set -euo pipefail
cd "$(dirname "$0")/.."

bash scripts/deploy.sh "$@"
node scripts/load.mjs "$@"
node scripts/validate.mjs "$@"
node scripts/cpu.mjs "$@"
