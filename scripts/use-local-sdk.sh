#!/usr/bin/env bash
# Switch to a local @sentry/cloudflare build via yalc.
#
#   # in sentry-javascript, for packages/core, packages/server-utils and packages/cloudflare:
#   yarn build && yarn yalc:publish
#   scripts/use-local-sdk.sh            # yalc links + pnpm overrides
#   scripts/use-local-sdk.sh --reset    # back to the npm version
#
# Transitive @sentry/* dependencies need pnpm overrides pointing at the .yalc copies, otherwise
# pnpm resolves them from npm and the local build is only partially used.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${1:-}" == "--reset" ]]; then
  git checkout -- package.json pnpm-lock.yaml
  rm -rf .yalc yalc.lock
  pnpm install
  exit 0
fi

command -v yalc >/dev/null || { echo "install yalc first: npm i -g yalc" >&2; exit 1; }
yalc add @sentry/core @sentry/server-utils @sentry/cloudflare
node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
p.pnpm = { ...(p.pnpm || {}), overrides: {
  "@sentry/core": "file:.yalc/@sentry/core",
  "@sentry/server-utils": "file:.yalc/@sentry/server-utils",
  "@sentry/cloudflare": "file:.yalc/@sentry/cloudflare",
} };
fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");'
pnpm install
node -p "'@sentry/cloudflare ' + require('@sentry/cloudflare/package.json').version"
