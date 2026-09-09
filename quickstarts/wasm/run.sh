#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   npm          the guide verbatim (error monitoring + tracing); module without a build_id section,
#                loaded with WebAssembly.instantiateStreaming(fetch(...))       -> results-npm.json
#   build-id     same page and bundle; module carrying `build_id` + `external_debug_info`
#                custom sections (what `wasm-split` adds)                      -> results-build-id.json
#   bytes        build-id module loaded with fetch().arrayBuffer() + WebAssembly.instantiate(bytes)
#   errors-only  the guide with only error monitoring selected (no browserTracingIntegration),
#                build-id module, streaming loader                              -> results-errors-only.json
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-npm}"
PORT="${PORT:-4734}"
export BASE_URL="http://localhost:${PORT}"
EXPECT_SPANS=1

case "$VARIANT" in
  npm)         BUNDLE=npm;         PAGE="/?wasm=divide.wasm&load=streaming" ;;
  build-id)    BUNDLE=npm;         PAGE="/?wasm=divide-buildid.wasm&load=streaming" ;;
  bytes)       BUNDLE=npm;         PAGE="/?wasm=divide-buildid.wasm&load=bytes" ;;
  errors-only) BUNDLE=errors-only; PAGE="/errors-only.html?wasm=divide-buildid.wasm&load=streaming"; EXPECT_SPANS=0 ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac
export EXPECT_SPANS

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "port $PORT is already in use, refusing to start"
  exit 1
fi

cd "$DIR"
timeout 120 node "$DIR/build.mjs" "$BUNDLE" || exit 1

PORT="$PORT" HOST=:: node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
trap 'kill $SINK_PID 2>/dev/null' EXIT
for _ in $(seq 1 100); do curl -sf "$BASE_URL/__items" >/dev/null && break; sleep 0.1; done

timeout 110 node "$DIR/drive.mjs" "$VARIANT" "$PAGE"
STATUS=$?

kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
echo "wrote $DIR/results-$VARIANT.json (console log: app-$VARIANT.log)"
exit $STATUS
