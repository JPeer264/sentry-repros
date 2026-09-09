#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   base              guide index.mdx:73-133 (index.jsx, all four product options) + the capture-errors include + the verify buttons
#   router            features/solid-router.mdx:20-45, withSentryRouterRouting(Router) with a parameterized route
#   router-unwrapped  the guide's index.jsx as-is around a plain @solidjs/router <Router> (no withSentryRouterRouting)
#   error-boundary    features/error-boundary.mdx:11 -> getting-started-capture-errors/javascript.solid.mdx:1-15 plus throw probes
# MODE=development ./run.sh <variant> builds with the `development` export condition (what `vite dev` does)
# and writes results-<variant>-dev.json.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-base}"
PORT="${PORT:-4723}"
export BASE_URL="http://localhost:${PORT}"
export MODE="${MODE:-production}"
SUFFIX=""
[ "$MODE" = "development" ] && SUFFIX="-dev"
export RESULT_NAME="results-${VARIANT}${SUFFIX}"

case "$VARIANT" in
  base|error-boundary) PAGE="/${VARIANT}.html" ;;
  router|router-unwrapped) PAGE="/${VARIANT}" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

cd "$DIR"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $PORT is in use"; exit 1; fi
timeout 120 node "$DIR/build.mjs" "$VARIANT" || exit 1

PORT="$PORT" node "$DIR/sink.mjs" > "$DIR/sink-${VARIANT}${SUFFIX}.log" 2>&1 &
SINK_PID=$!
trap 'kill $SINK_PID 2>/dev/null' EXIT
for _ in $(seq 1 100); do curl -sf "$BASE_URL/__items" >/dev/null && break; sleep 0.1; done

# drive.mjs keeps its own 60 s deadline; the outer timeout only guards a hung browser launch.
timeout 120 node "$DIR/drive.mjs" "$VARIANT" "$PAGE"
STATUS=$?

kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/${RESULT_NAME}.json (console log: app-${VARIANT}${SUFFIX}.log)"
exit $STATUS
