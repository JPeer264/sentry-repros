#!/bin/bash
# Restores node_modules for this probe: Deno's own deps, then the develop SDK tarballs.
set -eu
cd "$(dirname "$0")"

deno install
npm --prefix sdk install --no-audit --no-fund

mkdir -p node_modules/@sentry
for p in deno core server-utils server-runtime-injection conventions; do
  ln -sfn "../../sdk/node_modules/@sentry/$p" "node_modules/@sentry/$p"
done
ls -l node_modules/@sentry
