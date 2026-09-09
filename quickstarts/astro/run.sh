#!/usr/bin/env bash
# Usage:
#   ./run.sh build [base|middleware|static-default|removed-option]   astro build -> dist/ or dist-<variant>/, build-<variant>.log, results-build-<variant>.json
#   ./run.sh base | view-transitions | server                        sink on 127.0.0.1:4756, `PORT=4757 node ./dist/server/entry.mjs`, drive.mjs
#   ./run.sh base-middleware | server-middleware                     the same against dist-middleware/
# Every process this script starts is killed before it exits.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
cd "$DIR"
export ASTRO_TELEMETRY_DISABLED=1
# Stack traces and build logs carry the absolute checkout path; every file this script writes gets it replaced.
scrub() { REPRO_ROOT="$REPRO_ROOT" perl -pi -e 's/\Q$ENV{REPRO_ROOT}\E/\$REPRO/g' "$@" 2>/dev/null; }
trap 'scrub results-*.json build-*.log server-*.log sink-*.log' EXIT
SINK_PORT="${SINK_PORT:-4756}"
APP_PORT="${APP_PORT:-4757}"
CMD="${1:-base}"

if [ "$CMD" = "build" ]; then
  V="${2:-base}"
  case "$V" in
    base) QS_VARIANT=base timeout 170 npx astro build > "build-$V.log" 2>&1; S=$? ;;
    middleware)
      cp variants/middleware.ts src/middleware.ts
      QS_VARIANT=middleware timeout 170 npx astro build > "build-$V.log" 2>&1; S=$?
      rm -f src/middleware.ts ;;
    static-default) QS_VARIANT=static-default QS_OUTPUT=static timeout 170 npx astro build > "build-$V.log" 2>&1; S=$? ;;
    removed-option) QS_VARIANT=removed-option timeout 170 npx astro build > "build-$V.log" 2>&1; S=$? ;;
    *) echo "unknown build variant $V"; exit 1 ;;
  esac
  echo "build $V exit $S (build-$V.log)"
  V="$V" S="$S" node -e '
    const fs = require("fs");
    const v = process.env.V, exit = Number(process.env.S);
    const build = fs.readFileSync(`build-${v}.log`, "utf8").split("\n");
    const dist = v === "base" ? "dist" : `dist-${v}`;
    const maps = fs.existsSync(dist) ? fs.readdirSync(dist, { recursive: true }).filter(f => String(f).endsWith(".map")).length : null;
    const out = {
      variant: v, kind: "build", exit,
      steps: [{ label: `ASTRO_TELEMETRY_DISABLED=1 QS_VARIANT=${v} astro build`, result: { exit, distExists: fs.existsSync(`${dist}/server/entry.mjs`), sourceMapFilesInDist: maps } }],
      console: { build },
      envelopes: null,
      verdict: { status: exit === 0 ? "build succeeded" : "build failed", sentryWarnings: build.filter(l => /sentry/i.test(l) && /warn/i.test(l)), errors: build.filter(l => /error/i.test(l) && !/sentry-vite-plugin/.test(l)).slice(0, 12) },
    };
    fs.writeFileSync(`results-build-${v}.json`, JSON.stringify(out, null, 2));
  '
  exit $S
fi

case "$CMD" in
  base|view-transitions|server) DIST="dist" ;;
  base-middleware|server-middleware) DIST="dist-middleware" ;;
  *) echo "unknown variant $CMD"; exit 1 ;;
esac
[ -f "$DIST/server/entry.mjs" ] || { echo "missing $DIST/server/entry.mjs, run ./run.sh build first"; exit 1; }

for p in "$SINK_PORT" "$APP_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $p is taken, refusing to start"; exit 1; fi
done

SINK_PID=""; APP_PID=""
cleanup() {
  [ -n "$APP_PID" ] && kill "$APP_PID" 2>/dev/null
  [ -n "$SINK_PID" ] && kill "$SINK_PID" 2>/dev/null
  wait 2>/dev/null
  scrub results-*.json build-*.log server-*.log sink-*.log
}
trap cleanup EXIT

PORT="$SINK_PORT" HOST=127.0.0.1 node sink.mjs > "sink-$CMD.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "http://127.0.0.1:$SINK_PORT/__items" >/dev/null && break; sleep 0.1; done

HOST=127.0.0.1 PORT="$APP_PORT" node "./$DIST/server/entry.mjs" > "server-$CMD.log" 2>&1 &
APP_PID=$!
for _ in $(seq 1 200); do curl -sf -o /dev/null "http://127.0.0.1:$APP_PORT/" && break; sleep 0.1; done

BUILD_V="base"; [ "$DIST" = "dist-middleware" ] && BUILD_V="middleware"
APP_URL="http://127.0.0.1:$APP_PORT" SINK_URL="http://127.0.0.1:$SINK_PORT" RESULT_NAME="results-$CMD" \
  SERVER_LOG="server-$CMD.log" BUILD_LOG="build-$BUILD_V.log" timeout 110 node drive.mjs "$CMD"
STATUS=$?
echo "drive exit $STATUS (results-$CMD.json, server-$CMD.log, sink-$CMD.log)"
exit $STATUS
