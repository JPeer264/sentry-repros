#!/usr/bin/env bash
# Usage: ./run.sh <variant>            (STAGE=build or STAGE=drive runs only that half, both stay under 3 minutes)
#   verbatim   index.mdx:60-105 replaces the generated app/app.js whole-file (no compat modules, no loadInitializers call)
#   base       generated app/app.js with the guide's Sentry import + init merged in, no instance initializer
#   perf       base plus app/instance-initializers/sentry-performance.js (packages/ember/UPGRADE.md:74-85)
# Every variant carries the verify button (index.mdx:141-146), the tracing controller (index.mdx:191-206),
# the wrapped route (ember-options.mdx:43-54), a parameterized route, a component and a fetch probe.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-base}"
PORT="${PORT:-4766}"
export BASE_URL="http://localhost:${PORT}"
export RESULT_NAME="results-${VARIANT}"

[ -f "$DIR/variants/$VARIANT/app.js" ] || { echo "unknown variant $VARIANT"; exit 1; }
cd "$DIR"
cp "variants/$VARIANT/app.js" app/app.js
if [ -f "variants/$VARIANT/sentry-performance.js" ]; then
  mkdir -p app/instance-initializers
  cp "variants/$VARIANT/sentry-performance.js" app/instance-initializers/sentry-performance.js
else
  rm -rf app/instance-initializers
fi

if [ "${STAGE:-all}" != "drive" ]; then
rm -rf dist
timeout 170 ./node_modules/.bin/ember build --environment=production > "build-${VARIANT}.log" 2>&1
BUILD=$?
if [ $BUILD -ne 0 ]; then
  echo "ember build failed (exit $BUILD), see build-${VARIANT}.log"; tail -30 "build-${VARIANT}.log"; exit 1
fi
fi
[ "${STAGE:-all}" = "build" ] && { echo "built dist/ for $VARIANT"; exit 0; }

PORT="$PORT" node "$DIR/sink.mjs" > "$DIR/sink-${VARIANT}.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$BASE_URL/__items" >/dev/null && break; sleep 0.1; done

timeout 170 node "$DIR/drive.mjs" "$VARIANT"
STATUS=$?

kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
pkill -f "chrome.*--headless.*playwright" 2>/dev/null
echo "wrote $DIR/${RESULT_NAME}.json (console log: app-${VARIANT}.log, build log: build-${VARIANT}.log)"
exit $STATUS
