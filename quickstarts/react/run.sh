#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   base                     guide index.mdx: instrument.js + main.jsx (React 19 reactErrorHandler) + verify buttons
#   error-boundary-plain     the error-boundary App on a plain createRoot, no reactErrorHandler hooks
#   error-boundary           features/error-boundary.mdx: ErrorBoundary, fallback fn, HOC, beforeCapture, captureReactException
#   react-router-v7          index.mdx routing step + features/react-router/v7.mdx data mode (react-router@7)
#   react-router-v7-declarative  features/react-router/v7.mdx declarative snippet verbatim (ReactDOM.render)
#   react-router-v7-useroutes    features/react-router/v7.mdx useRoutes snippet verbatim (wrapUseRoutes vs wrapUseRoutesV7)
#   react-router-v8          features/react-router/v8.mdx data mode with the version-agnostic APIs (react-router@8)
#   profiler                 features/component-monitoring.mdx withProfiler(App)
#   redux                    index.mdx Redux step: createReduxEnhancer + createStore(rootReducer, compose(enhancer))
# MODE=development ./run.sh <variant> builds the development bundles and writes results-<variant>-dev.json.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-base}"
PORT="${PORT:-4713}"
export BASE_URL="http://localhost:${PORT}"
export MODE="${MODE:-production}"
SUFFIX=""
[ "$MODE" = "development" ] && SUFFIX="-dev"
export RESULT_NAME="results-${VARIANT}${SUFFIX}"

case "$VARIANT" in
  react-router-v7|react-router-v8) PAGE="/users/42" ;;
  base|error-boundary|error-boundary-plain|react-router-v7-declarative|react-router-v7-useroutes|profiler|redux) PAGE="/${VARIANT}.html" ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

cd "$DIR"
node "$DIR/build.mjs" "$VARIANT" || exit 1

SPA_PAGE="${VARIANT}.html" PORT="$PORT" node "$DIR/sink.mjs" > "$DIR/sink-${VARIANT}${SUFFIX}.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$BASE_URL/__items" >/dev/null && break; sleep 0.1; done

node "$DIR/drive.mjs" "$VARIANT" "$PAGE"
STATUS=$?

kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/${RESULT_NAME}.json (console log: app-${VARIANT}${SUFFIX}.log)"
exit $STATUS
