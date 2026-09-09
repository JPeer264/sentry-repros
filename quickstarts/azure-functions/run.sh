#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   verify              function-verify.js               (Configure with tracesSampleRate + Verify > Issues, v3 (context, req) handler)
#   errors-only         function-verify-errors-only.js   (Configure without tracesSampleRate + Verify > Issues)
#   tracing             function-tracing.js              (Verify > Tracing, startSpan "My Custom Span")
#   capture-errors      function-capture-errors.js       (Capture Errors snippet verbatim, placeholder try body)
#   logs                function-logs.js                 (logs verify include inside a function of the guide's shape)
#   normalized-request  function-verify-normalized.js    (repro-only: normalizedRequest instead of request)
#   v4-model            function-v4.js                   (repro-only: @azure/functions v4 app.http handler)
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-verify}"
SINK_PORT="${SINK_PORT:-4745}"
SINK="http://127.0.0.1:${SINK_PORT}"
if lsof -nP -iTCP:"$SINK_PORT" -sTCP:LISTEN >/dev/null 2>&1; then echo "port $SINK_PORT is busy"; exit 1; fi

cd "$DIR"
MODEL=v3
EXPECT_SPANS=1
case "$VARIANT" in
  verify)             FILE=function-verify.js ;;
  errors-only)        FILE=function-verify-errors-only.js; EXPECT_SPANS=0 ;;
  tracing)            FILE=function-tracing.js ;;
  capture-errors)     FILE=function-capture-errors.js ;;
  logs)               FILE=function-logs.js ;;
  normalized-request) FILE=function-verify-normalized.js ;;
  v4-model)           FILE=function-v4.js; MODEL=v4 ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac
CMD="node invoke.mjs $VARIANT $FILE $MODEL verify"

PORT="$SINK_PORT" node "$DIR/sink.mjs" > "$DIR/sink-$VARIANT.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK/__items" >/dev/null && break; sleep 0.1; done

# The runner invokes the handler once, then waits for its own sentinel (60 s deadline); 120 s is the hard cap.
SENTRY_TUNNEL="$SINK/" EXPECT_SPANS="$EXPECT_SPANS" timeout 120 node invoke.mjs "$VARIANT" "$FILE" "$MODEL" verify > "$DIR/app-$VARIANT.log" 2>&1
echo "runner exit code $?" >> "$DIR/app-$VARIANT.log"

REPRO_ROOT="$(cd "$DIR/../.." && pwd)"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/app-$VARIANT.log"
node "$DIR/summarize.mjs" "$VARIANT" "$CMD" "$DIR/app-$VARIANT.log" "$DIR/.steps-$VARIANT.json" "$SINK" > "$DIR/results-$VARIANT.json"
rm -f "$DIR/.steps-$VARIANT.json"
sed -i '' "s#$REPRO_ROOT#\$REPRO#g" "$DIR/results-$VARIANT.json"

kill "$SINK_PID" 2>/dev/null; wait "$SINK_PID" 2>/dev/null
echo "wrote results-$VARIANT.json (runner log: app-$VARIANT.log)"
